import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Role hierarchy: who can create whom
const ROLE_HIERARCHY: Record<string, string[]> = {
  superadmin: ['admin'],
  admin: ['pi'],
  pi: ['co_pi', 'jrf', 'assistant'],
  co_pi: ['assistant', 'jrf', 'student'],
};

// Map app role to project role label
const ROLE_PROJECT_LABEL: Record<string, string> = {
  co_pi: 'Co-PI',
  jrf: 'JRF',
  assistant: 'Project Assistant',
  student: 'Student',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Verify the requesting user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUser = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Get creator's profile
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
    const { data: creatorProfile } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (!creatorProfile) {
      return new Response(JSON.stringify({ error: 'Creator profile not found' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { email, password, name, role, department_id, mobile_number, project_id } = await req.json();

    // Validate required fields
    if (!email || !password || !name || !role) {
      return new Response(JSON.stringify({ error: 'Missing required fields: email, password, name, role' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Validate hierarchy
    const allowedRoles = ROLE_HIERARCHY[creatorProfile.role] || [];
    if (!allowedRoles.includes(role)) {
      return new Response(JSON.stringify({ error: `Role '${creatorProfile.role}' cannot create '${role}' users` }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Department inheritance: use creator's department unless superadmin specifies one
    const targetDeptId = creatorProfile.role === 'superadmin' ? (department_id || creatorProfile.department_id) : creatorProfile.department_id;

    // Create the auth user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role },
    });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Update the profile with department and other info (trigger already created the profile)
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        department_id: targetDeptId,
        mobile_number: mobile_number || null,
        created_by: user.id,
      })
      .eq('user_id', newUser.user!.id);

    if (updateError) {
      console.error('Profile update error:', updateError);
    }

    // If a project_id is provided, add the new user as a team member
    if (project_id) {
      // Get the new user's profile id
      const { data: newProfile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('user_id', newUser.user!.id)
        .single();

      if (newProfile) {
        const roleLabel = ROLE_PROJECT_LABEL[role] || role;
        const { error: teamError } = await supabaseAdmin
          .from('team_members')
          .insert({
            project_id,
            profile_id: newProfile.id,
            role_on_project: roleLabel,
          });

        if (teamError) {
          console.error('Team member insert error:', teamError);
        }

        // Log team member addition
        await supabaseAdmin.from('activity_logs').insert({
          user_id: user.id,
          project_id,
          type: 'team_member_added',
          description: `${name} (${roleLabel}) added to project by ${creatorProfile.name}`,
        });
      }
    }

    // Log activity
    await supabaseAdmin.from('activity_logs').insert({
      user_id: user.id,
      type: 'user_created',
      description: `User ${name} (${email}) created with role ${role} by ${creatorProfile.name}`,
    });

    return new Response(JSON.stringify({ success: true, user_id: newUser.user!.id }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
