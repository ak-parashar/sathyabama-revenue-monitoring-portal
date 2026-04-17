import express, { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { query } from './db';
import dotenv from 'dotenv';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        role: string;
        email: string;
    };
}

// Middleware to verify JWT
export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access denied' });

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
};

// Middleware to check roles
export const authorizeRoles = (...roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Permission denied' });
        }
        next();
    };
};

const router = express.Router();

// Login route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const result = await query('SELECT * FROM profiles WHERE email = $1 AND deleted_at IS NULL', [email]);
        const profile = result.rows[0];

        if (!profile) return res.status(401).json({ error: 'Invalid email or password' });

        const validPassword = await bcrypt.compare(password, profile.password);
        if (!validPassword) return res.status(401).json({ error: 'Invalid email or password' });

        const token = jwt.sign(
            { id: profile.id, role: profile.role, email: profile.email },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            profile: {
                id: profile.id,
                name: profile.name,
                email: profile.email,
                role: profile.role,
                department_id: profile.department_id,
                avatar_url: profile.avatar_url
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

// Seed an initial admin user if none exists (for dev purposes)
router.post('/seed-admin', async (req, res) => {
    const { email, password, name } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        await query(
            'INSERT INTO profiles (name, email, password, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING',
            [name, email, hashedPassword, 'superadmin']
        );
        res.json({ message: 'User seeded successfully' });
    } catch (err: any) {
        console.error('Seeding error:', err);
        res.status(500).json({ error: 'Seeding failed', details: err.message });
    }
});

export default router;
