import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import path from 'path';
import multer from 'multer';
import authRoutes, { authenticateToken, authorizeRoles } from './auth';
import { query } from './db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);

// Projects API
app.get('/api/projects', authenticateToken, async (req: any, res) => {
    const { id, role } = req.user;

    try {
        const baseSelect = `
            SELECT p.*,
                   json_build_object('name', d.name) as departments,
                   json_build_object('name', pr.name, 'email', pr.email) as profiles
            FROM projects p
            LEFT JOIN departments d ON p.department_id = d.id
            LEFT JOIN profiles pr ON p.pi_id = pr.id
            WHERE p.deleted_at IS NULL
        `;

        let result;
        if (role === 'superadmin') {
            // Dean - see everything
            result = await query(baseSelect + ' ORDER BY p.created_at DESC');
        } else if (role === 'admin') {
            // HOD - see all projects in their department
            const profile = await query('SELECT department_id FROM profiles WHERE id = $1', [id]);
            const deptId = profile.rows[0]?.department_id;
            if (!deptId) return res.json([]);
            result = await query(baseSelect + ' AND p.department_id = $1 ORDER BY p.created_at DESC', [deptId]);
        } else if (role === 'pi') {
            // PI - strictly only projects where they are the primary PI
            result = await query(baseSelect + ' AND p.pi_id = $1 ORDER BY p.created_at DESC', [id]);
        } else {
            // Co-PI, JRF, Assistant - strictly only projects where they are team members
            result = await query(`
                SELECT p.*,
                       json_build_object('name', d.name) as departments,
                       json_build_object('name', pr.name, 'email', pr.email) as profiles
                FROM projects p
                LEFT JOIN departments d ON p.department_id = d.id
                LEFT JOIN profiles pr ON p.pi_id = pr.id
                JOIN team_members tm ON p.id = tm.project_id
                WHERE tm.profile_id = $1 AND tm.removed_at IS NULL AND p.deleted_at IS NULL
                ORDER BY p.created_at DESC
            `, [id]);
        }
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch projects' });
    }
});

app.get('/api/projects/:id', authenticateToken, async (req: any, res) => {
    try {
        const userRole = req.user.role;
        const userId = req.user.id;

        const project = await query('SELECT * FROM projects WHERE id = $1 AND deleted_at IS NULL', [req.params.id]);
        if (!project.rows[0]) return res.status(404).json({ error: 'Project not found' });
        
        const proj = project.rows[0];

        // Access Control Logic
        let hasAccess = false;
        if (userRole === 'superadmin') {
            hasAccess = true;
        } else if (userRole === 'admin') {
            // HOD can see if they belong to the same department
            const profile = await query('SELECT department_id FROM profiles WHERE id = $1', [userId]);
            if (profile.rows[0]?.department_id === proj.department_id) {
                hasAccess = true;
            }
        } else if (userRole === 'pi') {
            // PI role - only their own projects
            if (proj.pi_id === userId) {
                hasAccess = true;
            }
        } else {
            // Staff/Team members
            const teamCheck = await query('SELECT 1 FROM team_members WHERE project_id = $1 AND profile_id = $2 AND removed_at IS NULL', [req.params.id, userId]);
            if (teamCheck.rows.length > 0) hasAccess = true;
        }

        if (!hasAccess) {
            return res.status(403).json({ error: 'You do not have permission to view this project.' });
        }

        // Fetch team members with project department fallback
        const team = await query(`
            SELECT tm.*, 
                   json_build_object(
                       'id', pr.id,
                       'name', pr.name, 
                       'email', pr.email, 
                       'role', pr.role, 
                       'mobile_number', pr.mobile_number,
                       'avatar_url', pr.avatar_url,
                       'departments', json_build_object('name', COALESCE(d.name, pd.name, 'N/A'))
                   ) as profiles,
                   (SELECT COUNT(*) FROM team_members WHERE profile_id = pr.id AND removed_at IS NULL) as project_count
            FROM team_members tm 
            JOIN profiles pr ON tm.profile_id = pr.id 
            JOIN projects p ON tm.project_id = p.id
            LEFT JOIN departments pd ON p.department_id = pd.id
            LEFT JOIN departments d ON pr.department_id = d.id
            WHERE tm.project_id = $1 AND tm.removed_at IS NULL
        `, [req.params.id]);
        const years = await query('SELECT * FROM project_years WHERE project_id = $1 AND deleted_at IS NULL ORDER BY year ASC', [req.params.id]);
        
        let logsQuery = 'SELECT al.*, p.name as user_name FROM activity_logs al LEFT JOIN profiles p ON al.user_id = p.id WHERE al.project_id = $1';
        let logsParams = [req.params.id];

        // Staff (Co-PI, JRF, Assistant) only see their own activities
        if (!['superadmin', 'admin', 'pi'].includes(userRole)) {
            logsQuery += ' AND al.user_id = $2';
            logsParams.push(userId);
        }

        logsQuery += ' ORDER BY al.created_at DESC LIMIT 50';
        const logs = await query(logsQuery, logsParams);

        res.json({
            ...proj,
            team: team.rows,
            years: years.rows,
            activities: logs.rows
        });
    } catch (err) {
        console.error('Error fetching project details:', err);
        res.status(500).json({ error: 'Failed to fetch project details' });
    }
});

app.post('/api/projects', authenticateToken, authorizeRoles('pi'), async (req: any, res) => {
    const { reference_id, title, department_id, duration_months, funding_agency, sanctioned_date, sanctioned_budget, pi_id, team_members } = req.body;
    const creator_id = req.user.id;

    try {
        // 1. Insert Project
        const projectResult = await query(
            `INSERT INTO projects (reference_id, title, department_id, duration_months, funding_agency, sanctioned_date, sanctioned_budget, pi_id, created_by, status) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'on_going') RETURNING *`,
            [reference_id, title, department_id, duration_months, funding_agency, sanctioned_date, sanctioned_budget, pi_id, creator_id]
        );
        const project = projectResult.rows[0];

        // 2. Add PI to team_members
        await query(
            'INSERT INTO team_members (project_id, profile_id, role_on_project) VALUES ($1, $2, $3)',
            [project.id, pi_id, 'PI']
        );

        // 3. Add other team members if provided
        if (Array.isArray(team_members)) {
            for (const member_id of team_members) {
                const memberProfile = await query('SELECT role FROM profiles WHERE id = $1', [member_id]);
                const role = memberProfile.rows[0]?.role?.toUpperCase() || 'TEAM_MEMBER';
                if (member_id !== pi_id) {
                    await query(
                        'INSERT INTO team_members (project_id, profile_id, role_on_project) VALUES ($1, $2, $3)',
                        [project.id, member_id, role]
                    );
                }
            }
        }

        // 4. Create Year 1 entry
        await query(
            'INSERT INTO project_years (project_id, year, fund, remarks) VALUES ($1, $2, $3, $4)',
            [project.id, 1, sanctioned_budget, 'Initial Project Entry']
        );

        // 5. Log Activity
        await query(
            'INSERT INTO activity_logs (project_id, user_id, type, description) VALUES ($1, $2, $3, $4)',
            [project.id, creator_id, 'project_created', 'Project created via local portal']
        );

        res.json(project);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create project', details: err.message });
    }
});

// Document/Year Update API (Restricted to JRF and Assistant)
app.post('/api/projects/:id/documents', authenticateToken, authorizeRoles('jrf', 'assistant'), upload.fields([
    { name: 'sanction_letter', maxCount: 1 },
    { name: 'release_order', maxCount: 1 },
    { name: 'utilization_certificate', maxCount: 1 }
]), async (req: any, res) => {
    const projectId = req.params.id;
    const { year, fund, remarks } = req.body;
    const files = (req.files as { [fieldname: string]: Express.Multer.File[] }) || {};

    try {
        const sanction_letter = files['sanction_letter'] ? files['sanction_letter'][0].path : null;
        const release_order = files['release_order'] ? files['release_order'][0].path : null;
        const utilization_certificate = files['utilization_certificate'] ? files['utilization_certificate'][0].path : null;
        const parsedFund = fund ? parseFloat(fund) : 0;

        const result = await query(
            `INSERT INTO project_years (project_id, year, sanction_letter, release_order, utilization_certificate, fund, remarks)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             ON CONFLICT (project_id, year) DO UPDATE SET
               sanction_letter = COALESCE(EXCLUDED.sanction_letter, project_years.sanction_letter),
               release_order = COALESCE(EXCLUDED.release_order, project_years.release_order),
               utilization_certificate = COALESCE(EXCLUDED.utilization_certificate, project_years.utilization_certificate),
               fund = project_years.fund + EXCLUDED.fund,
               remarks = COALESCE(EXCLUDED.remarks, project_years.remarks),
               updated_at = now()
             RETURNING *`,
            [projectId, year, sanction_letter, release_order, utilization_certificate, parsedFund, remarks]
        );

        // Update project totals
        if (parsedFund > 0) {
            await query(
                'UPDATE projects SET received_budget = received_budget + $1 WHERE id = $2',
                [parsedFund, projectId]
            );
        }

        // Log Activity
        await query(
            'INSERT INTO activity_logs (project_id, user_id, type, description, amount, attachment) VALUES ($1, $2, $3, $4, $5, $6)',
            [projectId, req.user.id, 'document_uploaded', `Document/Fund update for Year ${year} by ${req.user.role}`, parsedFund, sanction_letter || release_order || utilization_certificate]
        );

        res.json(result.rows[0]);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update documents', details: err.message });
    }
});

// Add Team Member to Project (Restricted to PI/Co-PI/Admin/Superadmin)
app.post('/api/projects/:id/team', authenticateToken, authorizeRoles('pi', 'co_pi', 'admin', 'superadmin'), async (req: any, res) => {
    const projectId = req.params.id;
    const { email, role, stipend, department_id } = req.body;
    const addedBy = req.user.id;

    try {
        // First verify if the user adding is authorized for THIS project
        if (req.user.role === 'pi' || req.user.role === 'co_pi') {
            const projCheck = await query('SELECT pi_id FROM projects WHERE id = $1', [projectId]);
            if (projCheck.rows[0]?.pi_id !== addedBy) {
                const teamCheck = await query('SELECT role_on_project FROM team_members WHERE project_id = $1 AND profile_id = $2 AND removed_at IS NULL', [projectId, addedBy]);
                if (!teamCheck.rows[0] || !['PI', 'CO-PI'].includes(teamCheck.rows[0].role_on_project)) {
                    return res.status(403).json({ error: 'Not authorized to add members to this project' });
                }
            }
        }

        // Find or create profile (simplified creation, assumes user might register later with same email)
        let profileResult = await query('SELECT id, name FROM profiles WHERE email = $1', [email]);
        let profileId;
        let profileName = 'New User';

        if (profileResult.rows.length === 0) {
            // Create a stub profile if they don't exist
            const tempPassword = await bcrypt.hash(Math.random().toString(36).slice(-8), 10);
            const newProfile = await query(
                `INSERT INTO profiles (name, email, password, role, department_id) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                [email.split('@')[0], email, tempPassword, role, department_id || null]
            );
            profileId = newProfile.rows[0].id;
            profileName = email.split('@')[0];
        } else {
            profileId = profileResult.rows[0].id;
            profileName = profileResult.rows[0].name;
            // Optionally update their global role if needed, but keeping it simple for now
        }

        // Add to team_members
        const result = await query(
            `INSERT INTO team_members (project_id, profile_id, role_on_project, stipend)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (project_id, profile_id)
             DO UPDATE SET role_on_project = EXCLUDED.role_on_project, stipend = EXCLUDED.stipend, removed_at = NULL
             RETURNING id`,
            [projectId, profileId, role.toUpperCase(), stipend || 0]
        );

        // Log Activity
        await query(
            'INSERT INTO activity_logs (project_id, user_id, type, description) VALUES ($1, $2, $3, $4)',
            [projectId, req.user.id, 'team_member_added', `Added ${profileName} as ${role.toUpperCase()}`]
        );

        res.json({ message: 'Team member added successfully', memberId: result.rows[0].id });
    } catch (err: any) {
        console.error('Add team member error:', err);
        res.status(500).json({ error: 'Failed to add team member', details: err.message });
    }
});

// Profile API
app.put('/api/projects/:id/status', authenticateToken, authorizeRoles('pi', 'admin', 'superadmin'), async (req: any, res) => {
    const projectId = req.params.id;
    const { status } = req.body;
    const userId = req.user.id;

    if (!['completed', 'terminated', 'on_going'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status' });
    }

    try {
        // Verify authorization for THIS project
        if (req.user.role === 'pi') {
            const projCheck = await query('SELECT pi_id FROM projects WHERE id = $1', [projectId]);
            if (projCheck.rows[0]?.pi_id !== userId) {
                return res.status(403).json({ error: 'Not authorized to update status for this project' });
            }
        }

        const result = await query(
            'UPDATE projects SET status = $1, updated_at = now() WHERE id = $2 RETURNING *',
            [status, projectId]
        );

        // Log Activity
        await query(
            'INSERT INTO activity_logs (project_id, user_id, type, description) VALUES ($1, $2, $3, $4)',
            [projectId, userId, 'project_updated', `Project status marked as ${status.toUpperCase()}`]
        );

        res.json(result.rows[0]);
    } catch (err: any) {
        console.error('Update status error:', err);
        res.status(500).json({ error: 'Failed to update project status' });
    }
});

// Profile API
app.get('/api/me', authenticateToken, async (req: any, res) => {
    try {
        const result = await query('SELECT id, name, email, role, department_id, avatar_url FROM profiles WHERE id = $1', [req.user.id]);
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Update Profile
app.put('/api/profile', authenticateToken, async (req: any, res) => {
    const { name, email } = req.body;
    try {
        const result = await query(
            'UPDATE profiles SET name = $1, email = $2, updated_at = now() WHERE id = $3 RETURNING id, name, email, role, avatar_url',
            [name, email, req.user.id]
        );
        res.json(result.rows[0]);
    } catch (err: any) {
        if (err.code === '23505') return res.status(400).json({ error: 'Email already exists' });
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Change Password
app.put('/api/profile/password', authenticateToken, async (req: any, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
        const user = await query('SELECT password FROM profiles WHERE id = $1', [req.user.id]);
        const valid = await bcrypt.compare(currentPassword, user.rows[0].password);
        if (!valid) return res.status(400).json({ error: 'Incorrect current password' });

        const hashed = await bcrypt.hash(newPassword, 10);
        await query('UPDATE profiles SET password = $1, updated_at = now() WHERE id = $2', [hashed, req.user.id]);
        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update password' });
    }
});

// Upload Avatar
app.post('/api/profile/avatar', authenticateToken, upload.single('avatar'), async (req: any, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const avatarUrl = req.file.path.replace(/\\/g, '/'); // Normalize path
    try {
        await query('UPDATE profiles SET avatar_url = $1, updated_at = now() WHERE id = $2', [avatarUrl, req.user.id]);
        res.json({ avatar_url: avatarUrl });
    } catch (err) {
        res.status(500).json({ error: 'Failed to upload avatar' });
    }
});

// User Management API
app.post('/api/users', authenticateToken, async (req: any, res) => {
    const { name, email, password, role, department_id, mobile_number, project_id } = req.body;
    const creatorRole = req.user.role;

    // Simplified role hierarchy check:
    // Admin (superadmin) -> HOD (admin)
    // HOD (admin) -> PI (pi)
    // PI (pi) -> Co-PI (co_pi), Assistant (assistant), JRF (jrf)
    const allowed = (creatorRole === 'superadmin' && role === 'admin') ||
        (creatorRole === 'admin' && role === 'pi') ||
        (creatorRole === 'pi' && ['co_pi', 'assistant', 'jrf'].includes(role));

    if (!allowed && creatorRole !== 'superadmin') {
        return res.status(403).json({ error: 'You are not allowed to create this role' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const userResult = await query(
            `INSERT INTO profiles (name, email, password, role, department_id, mobile_number) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [name, email, hashedPassword, role, department_id || null, mobile_number]
        );

        const newUser = userResult.rows[0];

        if (project_id) {
            await query(
                'INSERT INTO team_members (project_id, profile_id, role_on_project) VALUES ($1, $2, $3)',
                [project_id, newUser.id, role.toUpperCase()]
            );
        }

        res.json({ message: 'User created successfully', id: newUser.id });
    } catch (err: any) {
        console.error(err);
        if (err.code === '23505') {
            return res.status(400).json({ error: 'A user with this email already exists' });
        }
        res.status(500).json({ error: 'Failed to create user' });
    }
});

app.get('/api/profiles', authenticateToken, async (req: any, res) => {
    const { role } = req.query;
    try {
        let q = 'SELECT id, name, email, role, department_id FROM profiles WHERE deleted_at IS NULL';
        const params = [];
        if (role) {
            q += ' AND role = $1';
            params.push(role);
        }
        const result = await query(q, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch profiles' });
    }
});

// Departments
app.get('/api/departments', async (req: any, res) => {
    try {
        const result = await query('SELECT * FROM departments WHERE deleted_at IS NULL ORDER BY name ASC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch departments' });
    }
});

// Announcements API
app.get('/api/announcements', authenticateToken, async (req: any, res) => {
    try {
        const result = await query('SELECT * FROM announcements WHERE deleted_at IS NULL ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch announcements' });
    }
});

app.post('/api/announcements', authenticateToken, authorizeRoles('superadmin', 'admin'), async (req: any, res) => {
    const { title, content, type, expires_at } = req.body;
    try {
        const result = await query(
            'INSERT INTO announcements (title, content, type, created_by, expires_at) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [title, content, type || 'info', req.user.id, expires_at || null]
        );
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create announcement' });
    }
});

app.delete('/api/announcements/:id', authenticateToken, authorizeRoles('superadmin', 'admin'), async (req: any, res) => {
    try {
        await query('UPDATE announcements SET deleted_at = now() WHERE id = $1', [req.params.id]);
        res.json({ message: 'Announcement deleted' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete announcement' });
    }
});

// Report Requests API
app.get('/api/report-requests', authenticateToken, async (req: any, res) => {
    try {
        const result = await query(`
            SELECT rr.*, p.title as project_title
            FROM report_requests rr
            LEFT JOIN projects p ON rr.project_id = p.id
            WHERE rr.user_id = $1 AND rr.deleted_at IS NULL
            ORDER BY rr.created_at DESC
        `, [req.user.id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch report requests' });
    }
});

app.post('/api/report-requests', authenticateToken, async (req: any, res) => {
    const { project_id, type, description } = req.body;
    try {
        const result = await query(
            'INSERT INTO report_requests (user_id, project_id, type, description, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [req.user.id, project_id || null, type, description || '', 'requested']
        );
        const report = result.rows[0];

        // Mock "Processing" - change status to completed after 5 seconds
        setTimeout(async () => {
            try {
                await query(
                    "UPDATE report_requests SET status = 'completed', download_url = $1, updated_at = now() WHERE id = $2",
                    ['/api/mock-report-download', report.id]
                );
            } catch (err) {
                console.error('Mock processing error:', err);
            }
        }, 5000);

        res.json(report);
    } catch (err) {
        res.status(500).json({ error: 'Failed to create report request' });
    }
});

// Financial Transactions API
app.post('/api/projects/:id/transactions', authenticateToken, async (req: any, res) => {
    const projectId = req.params.id;
    const { type, amount, description } = req.body;
    const userId = req.user.id;

    if (!['received', 'spent', 'stipend'].includes(type)) {
        return res.status(400).json({ error: 'Invalid transaction type' });
    }

    try {
        // Verify authorization (PI of project or Admin)
        const projectResult = await query('SELECT pi_id FROM projects WHERE id = $1', [projectId]);
        if (!projectResult.rows[0]) return res.status(404).json({ error: 'Project not found' });
        
        const isPI = projectResult.rows[0].pi_id === userId;
        const isSuperadmin = req.user.role === 'superadmin';
        const isAdmin = req.user.role === 'admin';

        if (isAdmin) {
            const profile = await query('SELECT department_id FROM profiles WHERE id = $1', [userId]);
            const project = await query('SELECT department_id FROM projects WHERE id = $1', [projectId]);
            if (profile.rows[0]?.department_id !== project.rows[0]?.department_id) {
                return res.status(403).json({ error: 'Not authorized to record transactions for projects in other departments' });
            }
        } else if (!isPI && !isSuperadmin) {
            return res.status(403).json({ error: 'Not authorized to record transactions for this project' });
        }

        // Insert Transaction
        const transactionResult = await query(
            'INSERT INTO financial_transactions (project_id, type, amount, description, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [projectId, type, amount, description, userId]
        );

        // Update Project Totals
        if (type === 'received') {
            await query('UPDATE projects SET received_budget = received_budget + $1 WHERE id = $2', [amount, projectId]);
        } else {
            // spent or stipend
            await query('UPDATE projects SET utilized_budget = utilized_budget + $1 WHERE id = $2', [amount, projectId]);
        }

        // Log Activity
        await query(
            'INSERT INTO activity_logs (project_id, user_id, type, description, amount) VALUES ($1, $2, $3, $4, $5)',
            [projectId, userId, type === 'received' ? 'revenue_received' : (type === 'stipend' ? 'stipend_released' : 'revenue_spent'), description, amount]
        );

        res.json(transactionResult.rows[0]);
    } catch (err: any) {
        console.error(err);
        res.status(500).json({ error: 'Failed to record transaction' });
    }
});

// Project Deletion API
app.delete('/api/projects/:id', authenticateToken, authorizeRoles('superadmin', 'admin'), async (req: any, res) => {
    try {
        await query('UPDATE projects SET deleted_at = now() WHERE id = $1', [req.params.id]);
        res.json({ message: 'Project deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete project' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
