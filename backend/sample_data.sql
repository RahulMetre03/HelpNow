-- Sample Data for HelpNow
-- Make sure to run schema.sql first!

-- 1. Insert Users (Password is 'password123' hashed with bcrypt)
-- Note: passlib bcrypt hashes usually start with $2b$, we'll use a hardcoded hash of 'password123'
INSERT INTO users (id, email, password_hash, full_name, role) VALUES 
('11111111-1111-1111-1111-111111111111', 'patient@example.com', '$2b$12$.BwRihA4cFRR4U3o430jhe8A8J7VzF4v5fLq9.MZb4b/G0kXJ/wA6', 'John Doe', 'patient'),
('22222222-2222-2222-2222-222222222222', 'therapist1@example.com', '$2b$12$.BwRihA4cFRR4U3o430jhe8A8J7VzF4v5fLq9.MZb4b/G0kXJ/wA6', 'Dr. Sarah Jenkins', 'therapist'),
('33333333-3333-3333-3333-333333333333', 'therapist2@example.com', '$2b$12$.BwRihA4cFRR4U3o430jhe8A8J7VzF4v5fLq9.MZb4b/G0kXJ/wA6', 'Dr. Michael Chen', 'therapist');

-- 2. Insert Therapists
INSERT INTO therapists (id, user_id, specialization, license_number, bio, experience_years, rating) VALUES 
('44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'Cognitive Behavioral Therapy', 'LIC-192837', 'Specializing in anxiety and depression management through evidence-based CBT approaches.', 8, 4.9),
('55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', 'Trauma & PTSD', 'LIC-982341', 'Compassionate care focused on trauma recovery and building long-term emotional resilience.', 12, 4.8);

-- 3. Insert Therapist Availability slots
INSERT INTO therapist_availability (therapist_id, day_of_week, start_time, end_time) VALUES 
-- Dr. Sarah (Mon, Wed, Fri 9am-5pm)
('44444444-4444-4444-4444-444444444444', 0, '09:00:00', '17:00:00'),
('44444444-4444-4444-4444-444444444444', 2, '09:00:00', '17:00:00'),
('44444444-4444-4444-4444-444444444444', 4, '09:00:00', '17:00:00'),
-- Dr. Michael (Tue, Thu 10am-6pm)
('55555555-5555-5555-5555-555555555555', 1, '10:00:00', '18:00:00'),
('55555555-5555-5555-5555-555555555555', 3, '10:00:00', '18:00:00');

-- 4. Insert Appointments
INSERT INTO appointments (user_id, therapist_id, scheduled_at, duration_minutes, status, notes) VALUES 
('11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', NOW() + INTERVAL '2 days', 60, 'confirmed', 'First consultation regarding stress management'),
('11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', NOW() - INTERVAL '5 days', 60, 'completed', 'Follow-up on sleep habits');

-- 5. Insert Chat Sessions
INSERT INTO chat_sessions (id, user_id, title) VALUES 
('66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'Feeling overwhelmed at work'),
('77777777-7777-7777-7777-777777777777', '11111111-1111-1111-1111-111111111111', 'Anxiety about upcoming presentation');

-- 6. Insert Chat Messages
INSERT INTO chat_messages (session_id, sender, content, sent_at) VALUES 
-- Session 1
('66666666-6666-6666-6666-666666666666', 'user', 'I am just feeling so exhausted and overwhelmed with all the deadlines.', NOW() - INTERVAL '2 hours'),
('66666666-6666-6666-6666-666666666666', 'ai', 'I hear how difficult that is. It sounds like you are carrying a lot right now. Have you been able to take any breaks for yourself today?', NOW() - INTERVAL '1 hour 59 minutes'),
('66666666-6666-6666-6666-666666666666', 'user', 'Not really, I just keep pushing through. But my heart is racing.', NOW() - INTERVAL '1 hour 58 minutes'),
('66666666-6666-6666-6666-666666666666', 'ai', 'It''s completely understandable your heart is racing when you''re under that much pressure. Let''s take a brief moment together — what if you try a simple breathing exercise right now?', NOW() - INTERVAL '1 hour 57 minutes'),

-- Session 2
('77777777-7777-7777-7777-777777777777', 'user', 'I have a big presentation tomorrow and I''m terrified I''ll blank out.', NOW() - INTERVAL '1 day'),
('77777777-7777-7777-7777-777777777777', 'ai', 'That''s a very common fear. It shows you care about doing well! What specifically are you most worried might happen?', NOW() - INTERVAL '23 hours');
