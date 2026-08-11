
-- ROLES
CREATE TYPE public.app_role AS ENUM ('student','mentor','admin');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  avatar_url TEXT,
  bio TEXT,
  college TEXT,
  branch TEXT DEFAULT 'CSE',
  year_of_study INT,
  target_role TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "profiles readable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id OR public.has_role(auth.uid(),'admin')) WITH CHECK (auth.uid() = id OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "own roles readable" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- new user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''), NEW.email)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'student')
  ON CONFLICT (user_id, role) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- CONTENT
CREATE TABLE public.modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number INT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  tier INT NOT NULL,
  tier_name TEXT NOT NULL DEFAULT '',
  week_start INT NOT NULL,
  week_end INT NOT NULL,
  icon TEXT DEFAULT 'BookOpen',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.modules TO anon, authenticated;
GRANT ALL ON public.modules TO service_role;
ALTER TABLE public.modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "modules public read" ON public.modules FOR SELECT USING (true);
CREATE POLICY "modules admin write" ON public.modules FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
GRANT INSERT, UPDATE, DELETE ON public.modules TO authenticated;

CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES public.modules(id) ON DELETE CASCADE,
  day_number INT NOT NULL,
  week_number INT NOT NULL DEFAULT 1,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  objective TEXT DEFAULT '',
  video_url TEXT,
  listening_script TEXT,
  shadowing_lines JSONB NOT NULL DEFAULT '[]'::jsonb,
  speaking_prompt TEXT,
  duration_minutes INT NOT NULL DEFAULT 60,
  is_free BOOLEAN NOT NULL DEFAULT false,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lessons TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.lessons TO authenticated;
GRANT ALL ON public.lessons TO service_role;
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lessons public read" ON public.lessons FOR SELECT USING (true);
CREATE POLICY "lessons admin write" ON public.lessons FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.vocabulary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  word TEXT NOT NULL,
  meaning TEXT NOT NULL,
  hindi_meaning TEXT NOT NULL DEFAULT '',
  pronunciation TEXT DEFAULT '',
  part_of_speech TEXT DEFAULT '',
  examples JSONB NOT NULL DEFAULT '[]'::jsonb,
  related_words JSONB NOT NULL DEFAULT '[]'::jsonb,
  category TEXT NOT NULL DEFAULT 'general',
  difficulty TEXT NOT NULL DEFAULT 'beginner',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.vocabulary TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.vocabulary TO authenticated;
GRANT ALL ON public.vocabulary TO service_role;
ALTER TABLE public.vocabulary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vocab public read" ON public.vocabulary FOR SELECT USING (true);
CREATE POLICY "vocab admin write" ON public.vocabulary FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.translation_sentences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  hindi TEXT NOT NULL,
  english TEXT NOT NULL,
  alternates JSONB NOT NULL DEFAULT '[]'::jsonb,
  category TEXT NOT NULL DEFAULT 'daily life',
  difficulty TEXT NOT NULL DEFAULT 'beginner',
  sort_order INT NOT NULL DEFAULT 0
);
GRANT SELECT ON public.translation_sentences TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.translation_sentences TO authenticated;
GRANT ALL ON public.translation_sentences TO service_role;
ALTER TABLE public.translation_sentences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "translations public read" ON public.translation_sentences FOR SELECT USING (true);
CREATE POLICY "translations admin write" ON public.translation_sentences FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'quiz',
  question TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  answer TEXT NOT NULL,
  explanation TEXT DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0
);
GRANT SELECT ON public.exercises TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.exercises TO authenticated;
GRANT ALL ON public.exercises TO service_role;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "exercises public read" ON public.exercises FOR SELECT USING (true);
CREATE POLICY "exercises admin write" ON public.exercises FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'template',
  category TEXT NOT NULL DEFAULT 'email',
  content TEXT NOT NULL DEFAULT '',
  difficulty TEXT NOT NULL DEFAULT 'beginner',
  module_number INT,
  is_preview BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.resources TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.resources TO authenticated;
GRANT ALL ON public.resources TO service_role;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "resources public read" ON public.resources FOR SELECT USING (true);
CREATE POLICY "resources admin write" ON public.resources FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- STUDENT DATA
CREATE TABLE public.progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  completion_percentage INT NOT NULL DEFAULT 0,
  minutes_spent INT NOT NULL DEFAULT 0,
  video_position INT NOT NULL DEFAULT 0,
  quiz_score INT,
  sections_done JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_accessed TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, lesson_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.progress TO authenticated;
GRANT ALL ON public.progress TO service_role;
ALTER TABLE public.progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own progress" ON public.progress FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "staff read progress" ON public.progress FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'mentor') OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.daily_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  minutes INT NOT NULL DEFAULT 0,
  xp INT NOT NULL DEFAULT 0,
  words_learned INT NOT NULL DEFAULT 0,
  tasks JSONB NOT NULL DEFAULT '[]'::jsonb,
  UNIQUE (user_id, activity_date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_activity TO authenticated;
GRANT ALL ON public.daily_activity TO service_role;
ALTER TABLE public.daily_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own activity" ON public.daily_activity FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "staff read activity" ON public.daily_activity FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'mentor') OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.vocabulary_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vocabulary_id UUID NOT NULL REFERENCES public.vocabulary(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'learning',
  times_correct INT NOT NULL DEFAULT 0,
  times_wrong INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, vocabulary_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.vocabulary_progress TO authenticated;
GRANT ALL ON public.vocabulary_progress TO service_role;
ALTER TABLE public.vocabulary_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own vocab progress" ON public.vocabulary_progress FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.translation_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sentence_id UUID NOT NULL REFERENCES public.translation_sentences(id) ON DELETE CASCADE,
  answer TEXT NOT NULL DEFAULT '',
  is_correct BOOLEAN NOT NULL DEFAULT false,
  score INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.translation_attempts TO authenticated;
GRANT ALL ON public.translation_attempts TO service_role;
ALTER TABLE public.translation_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own translation attempts" ON public.translation_attempts FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE public.speaking_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  prompt TEXT NOT NULL,
  transcript TEXT,
  audio_url TEXT,
  duration_seconds INT NOT NULL DEFAULT 0,
  score INT,
  feedback JSONB,
  mentor_feedback TEXT,
  status TEXT NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.speaking_submissions TO authenticated;
GRANT ALL ON public.speaking_submissions TO service_role;
ALTER TABLE public.speaking_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own speaking" ON public.speaking_submissions FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "staff read speaking" ON public.speaking_submissions FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'mentor') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "staff feedback speaking" ON public.speaking_submissions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'mentor') OR public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'mentor') OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.writing_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  exercise_type TEXT NOT NULL DEFAULT 'email',
  situation TEXT NOT NULL,
  answer TEXT NOT NULL,
  score INT,
  feedback JSONB,
  mentor_feedback TEXT,
  status TEXT NOT NULL DEFAULT 'submitted',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.writing_submissions TO authenticated;
GRANT ALL ON public.writing_submissions TO service_role;
ALTER TABLE public.writing_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own writing" ON public.writing_submissions FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "staff read writing" ON public.writing_submissions FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'mentor') OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "staff feedback writing" ON public.writing_submissions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'mentor') OR public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'mentor') OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT '🏆'
);
GRANT SELECT ON public.badges TO anon, authenticated;
GRANT ALL ON public.badges TO service_role;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "badges public read" ON public.badges FOR SELECT USING (true);

CREATE TABLE public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_code TEXT NOT NULL REFERENCES public.badges(code) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, badge_code)
);
GRANT SELECT, INSERT, DELETE ON public.user_badges TO authenticated;
GRANT ALL ON public.user_badges TO service_role;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own badges" ON public.user_badges FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "staff read badges" ON public.user_badges FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'mentor') OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  certificate_id TEXT NOT NULL UNIQUE DEFAULT ('CSE-PE-' || upper(substr(replace(gen_random_uuid()::text,'-',''),1,10))),
  program TEXT NOT NULL DEFAULT 'CSE Professional English — 6 Month Program',
  completion_date DATE,
  status TEXT NOT NULL DEFAULT 'locked',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, program)
);
GRANT SELECT, INSERT, UPDATE ON public.certificates TO authenticated;
GRANT ALL ON public.certificates TO service_role;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own certificates" ON public.certificates FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "admin manage certificates" ON public.certificates FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- COMMUNITY
CREATE TABLE public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'english practice',
  likes INT NOT NULL DEFAULT 0,
  is_question BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.community_posts TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.community_posts TO authenticated;
GRANT ALL ON public.community_posts TO service_role;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posts public read" ON public.community_posts FOR SELECT USING (true);
CREATE POLICY "posts own write" ON public.community_posts FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "posts own update" ON public.community_posts FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "posts own delete" ON public.community_posts FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.community_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.community_replies TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.community_replies TO authenticated;
GRANT ALL ON public.community_replies TO service_role;
ALTER TABLE public.community_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "replies public read" ON public.community_replies FOR SELECT USING (true);
CREATE POLICY "replies own write" ON public.community_replies FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "replies own update" ON public.community_replies FOR UPDATE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "replies own delete" ON public.community_replies FOR DELETE TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.live_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  mentor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  mentor_name TEXT NOT NULL DEFAULT '',
  session_date DATE NOT NULL,
  session_time TEXT NOT NULL DEFAULT '19:00',
  meeting_link TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.live_sessions TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.live_sessions TO authenticated;
GRANT ALL ON public.live_sessions TO service_role;
ALTER TABLE public.live_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions public read" ON public.live_sessions FOR SELECT USING (true);
CREATE POLICY "sessions staff write" ON public.live_sessions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'mentor') OR public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'mentor') OR public.has_role(auth.uid(),'admin'));

CREATE TABLE public.session_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES public.live_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (session_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.session_registrations TO authenticated;
GRANT ALL ON public.session_registrations TO service_role;
ALTER TABLE public.session_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own registrations" ON public.session_registrations FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "staff read registrations" ON public.session_registrations FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'mentor') OR public.has_role(auth.uid(),'admin'));

-- SEED: badges
INSERT INTO public.badges (code, title, description, icon) VALUES
('first_lesson','First Lesson','Completed your very first lesson','🏆'),
('streak_7','7 Day Streak','Practised English 7 days in a row','🔥'),
('streak_30','30 Day Streak','Practised English 30 days in a row','🔥'),
('first_speaking','First Speaking Practice','Recorded your first spoken answer','🎤'),
('words_100','100 Words','Learned 100 vocabulary words','📚'),
('first_email','First Professional Email','Wrote your first professional email','📧'),
('interview_ready','Interview Ready','Finished the interview modules','💼'),
('program_complete','Program Completed','Completed the full 6-month program','🎓');

-- SEED: modules
INSERT INTO public.modules (number,title,description,tier,tier_name,week_start,week_end,icon,sort_order) VALUES
(1,'Self Introduction','Personal, academic, professional and project introductions for CSE students.',1,'Foundation',1,2,'User',1),
(2,'Basic Professional Vocabulary','Technology, workplace, college and coding vocabulary taught in context.',1,'Foundation',3,3,'BookOpen',2),
(3,'Daily Conversation','Real conversations with classmates, professors and teammates.',1,'Foundation',4,4,'MessageCircle',3),
(4,'Email Writing','Formal, request, follow-up, leave and internship emails with templates.',2,'Communication',5,6,'Mail',4),
(5,'Chat & Messaging','Professional messaging on WhatsApp, Slack and Teams.',2,'Communication',7,7,'MessageSquare',5),
(6,'Interview Basics','Tell me about yourself, strengths, goals and basic HR questions.',2,'Communication',8,8,'Briefcase',6),
(7,'Coding Discussion','Explain code, algorithms, bugs and technical decisions in English.',3,'Technical Communication',9,10,'Code',7),
(8,'Group Discussion','Open, agree, disagree politely, add points and conclude a GD.',3,'Technical Communication',11,11,'Users',8),
(9,'Presentation Skills','Start, explain, transition, handle questions and close confidently.',3,'Technical Communication',12,12,'Presentation',9),
(10,'Client Communication','Meetings, requirements, clarification, updates and negotiation.',4,'Professional Communication',13,14,'Handshake',10),
(11,'Professor Communication','Doubts, meetings, assignments and extension requests.',4,'Professional Communication',15,15,'GraduationCap',11),
(12,'Meetings','Stand-ups, updates, blockers, questions and conclusions.',4,'Professional Communication',16,16,'CalendarClock',12),
(13,'LinkedIn English','Headline, about section, project descriptions and professional posts.',5,'Advanced Professional English',17,18,'Linkedin',13),
(14,'Resume English','Summaries, action verbs, achievements and project descriptions.',5,'Advanced Professional English',19,19,'FileText',14),
(15,'HR Interview','Behavioural, situational and career questions with mock practice.',5,'Advanced Professional English',20,20,'UserCheck',15),
(16,'Public Speaking','Confidence, stage presence, structure and impromptu speaking.',6,'Mastery',21,22,'Mic',16),
(17,'Video Creation','Coding tutorials, project demos and technical explanation videos.',6,'Mastery',23,24,'Video',17);

-- SEED: Week 1 lessons (Module 1)
INSERT INTO public.lessons (module_id, day_number, week_number, title, description, objective, speaking_prompt, listening_script, shadowing_lines, is_free, sort_order)
SELECT m.id, d.day, 1, d.title, d.description, d.objective, d.prompt, d.script, d.lines::jsonb, (d.day <= 2), d.day
FROM public.modules m,
(VALUES
 (1,'Self Introduction Basics','Build a clear, natural 60-second introduction you can use anywhere.','Introduce yourself confidently in 5 sentences without pausing.','Introduce yourself in English for 60 seconds. Include your name, college, branch and one thing you enjoy building.','Hi, my name is Rohan Sharma. I am a third-year Computer Science student at Delhi Technical Institute. I enjoy building web applications, and I am currently learning backend development. I like solving problems, and I am working on improving my communication skills. Thank you for listening.','["Hi, my name is Rohan Sharma.","I am a third-year Computer Science student.","I enjoy building web applications.","I am currently learning backend development.","I am working on improving my communication skills."]'),
 (2,'Academic Introduction','Talk about your college, semester, subjects and academic interests.','Describe your academic background in a structured way.','Describe your academic background: your college, semester, favourite subject and why you like it.','I am pursuing a Bachelor of Technology in Computer Science. I am currently in my fifth semester. My favourite subjects are Data Structures and Operating Systems. I enjoy Data Structures because it improves my problem-solving ability. Apart from academics, I take part in coding contests.','["I am pursuing a Bachelor of Technology in Computer Science.","I am currently in my fifth semester.","My favourite subject is Data Structures.","It improves my problem-solving ability.","I also take part in coding contests."]'),
 (3,'Talking About Your CSE Branch','Explain what you study and why you chose Computer Science.','Explain your branch and motivation in simple professional English.','Why did you choose Computer Science? Answer in English for one minute.','I chose Computer Science because I have always been curious about how software works. In my branch, we study programming, algorithms, databases and networks. What I like most is that I can build something useful with just a laptop. Every semester I learn a new technology. This branch gives me a lot of career options.','["I chose Computer Science because I was curious about how software works.","We study programming, algorithms, databases and networks.","I can build something useful with just a laptop.","Every semester I learn a new technology.","This branch gives me many career options."]'),
 (4,'Talking About Your Skills','Present your technical and soft skills without sounding rehearsed.','Describe your skills with evidence, not just keywords.','Talk about your top three technical skills and give one example of how you used each.','I am comfortable with Java and Python. I have built two projects using React and Node.js. I also understand basic database design with MySQL. Besides technical skills, I am a good team player. I am currently working on my English communication skills.','["I am comfortable with Java and Python.","I have built two projects using React and Node.js.","I understand basic database design.","I am a good team player.","I am working on my communication skills."]'),
 (5,'Talking About Your Projects','Explain a project clearly: problem, solution, tech stack and your role.','Use the Problem-Solution-Stack-Role structure.','Explain your current or favourite project in English. Mention the problem, your solution and your role.','Let me tell you about my recent project. The problem was that students could not track their attendance easily. So I built a web application where students can log in and check attendance in real time. I used React for the frontend and Node.js for the backend. My role was to design the database and build the API.','["Let me tell you about my recent project.","The problem was that students could not track attendance easily.","I built a web application to solve this.","I used React for the frontend and Node.js for the backend.","My role was to design the database and build the API."]'),
 (6,'Talking About Your Goals','Speak about short-term and long-term career goals professionally.','Answer career goal questions without vague statements.','What are your short-term and long-term career goals? Answer in English.','In the short term, I want to strengthen my backend development skills. I am preparing for an internship in a product-based company. In the long term, I would like to become a software engineer who works on scalable systems. I also want to improve my communication so I can lead a team one day. I believe consistent daily practice will help me reach these goals.','["In the short term, I want to strengthen my backend skills.","I am preparing for an internship.","In the long term, I want to work on scalable systems.","I also want to improve my communication.","Consistent daily practice will help me reach these goals."]'),
 (7,'Complete Self Introduction','Combine everything into one confident two-minute introduction.','Deliver a full introduction covering background, skills, projects and goals.','Give your complete self introduction covering background, skills, projects and goals. Record it and compare with Day 1.','Good morning. My name is Rohan Sharma and I am a third-year Computer Science student. I am comfortable with Java, Python and web development. Recently I built an attendance tracking application using React and Node.js. In the short term I am looking for an internship where I can learn from experienced engineers. In the long term, I want to build scalable products and lead a team. Thank you for giving me this opportunity.','["Good morning. My name is Rohan Sharma.","I am a third-year Computer Science student.","Recently I built an attendance tracking application.","I am looking for an internship where I can learn.","Thank you for giving me this opportunity."]')
) AS d(day,title,description,objective,prompt,script,lines)
WHERE m.number = 1;

-- SEED: vocabulary for Day 1 and general
INSERT INTO public.vocabulary (lesson_id, word, meaning, hindi_meaning, pronunciation, part_of_speech, examples, related_words, category, difficulty)
SELECT l.id, v.word, v.meaning, v.hindi, v.pron, v.pos, v.examples::jsonb, v.related::jsonb, v.category, v.difficulty
FROM public.lessons l,
(VALUES
 ('pursue','to follow or work towards something','आगे बढ़ाना / हासिल करने की कोशिश करना','/pərˈsjuː/','verb','["I am pursuing a degree in Computer Science.","She decided to pursue a career in data science.","We should pursue this idea in the next sprint."]','["chase","follow","aim"]','academic','beginner'),
 ('currently','at the present time','अभी / वर्तमान में','/ˈkʌrəntli/','adverb','["I am currently learning backend development.","He is currently working on a client project.","We are currently testing the new feature."]','["presently","now"]','general','beginner'),
 ('background','a person''s education and experience','पृष्ठभूमि','/ˈbækɡraʊnd/','noun','["My background is in Computer Science.","Can you tell me about your academic background?","She has a strong background in machine learning."]','["experience","history"]','professional','beginner'),
 ('confident','feeling sure about your ability','आत्मविश्वासी','/ˈkɒnfɪdənt/','adjective','["I feel confident while speaking in English now.","He is confident about the interview.","Be confident when you explain your project."]','["assured","self-assured"]','soft skills','beginner'),
 ('improve','to make something better','सुधारना','/ɪmˈpruːv/','verb','["I want to improve my communication skills.","We improved the loading speed of the website.","Daily practice improves fluency."]','["enhance","upgrade"]','general','beginner'),
 ('opportunity','a chance to do something','अवसर','/ˌɒpəˈtjuːnəti/','noun','["Thank you for this opportunity.","This internship is a great opportunity to learn.","I am looking for an opportunity in backend development."]','["chance","opening"]','professional','beginner'),
 ('responsible','having a duty to do something','जिम्मेदार','/rɪˈspɒnsəbl/','adjective','["I was responsible for the database design.","She is responsible for client communication.","Each member is responsible for one module."]','["accountable","in charge"]','workplace','beginner'),
 ('deploy','to release software so people can use it','तैनात करना / लाइव करना','/dɪˈplɔɪ/','verb','["We deployed the application last Friday.","I deploy my projects on the cloud.","The team will deploy the fix tonight."]','["release","launch"]','coding','intermediate'),
 ('debug','to find and fix errors in code','त्रुटि ठीक करना','/ˌdiːˈbʌɡ/','verb','["It took me two hours to debug the login issue.","Let me debug this function first.","We debug the code before every release."]','["fix","troubleshoot"]','coding','intermediate'),
 ('collaborate','to work together with others','मिलकर काम करना','/kəˈlæbəreɪt/','verb','["I collaborated with two classmates on this project.","Our team collaborates using Slack.","Developers collaborate with designers regularly."]','["cooperate","team up"]','workplace','intermediate')
) AS v(word,meaning,hindi,pron,pos,examples,related,category,difficulty)
WHERE l.day_number = 1 AND l.week_number = 1;

-- SEED: exercises for Day 1
INSERT INTO public.exercises (lesson_id, type, question, options, answer, explanation, sort_order)
SELECT l.id, 'quiz', e.q, e.options::jsonb, e.a, e.exp, e.ord
FROM public.lessons l,
(VALUES
 ('Which sentence is the most professional way to start an introduction?','["Myself Rohan Sharma.","I am Rohan Sharma.","Me Rohan.","This side Rohan."]','I am Rohan Sharma.','"Myself Rohan" and "this side" are common Indian-English habits. In professional English, use "I am ..." or "My name is ...".',1),
 ('Choose the correct sentence.','["I am study in third year.","I am studying in third year.","I studying third year.","I am studied third year."]','I am studying in third year.','Present continuous needs "am + verb-ing".',2),
 ('What does the word "pursue" mean?','["To stop something","To work towards something","To repeat something","To delete something"]','To work towards something','Pursue = to follow or work towards a goal, e.g. "I am pursuing B.Tech".',3),
 ('Which sentence is best for describing your project?','["I have made one project.","I built a web application that tracks attendance.","Project is there in my resume.","Project was done by me."]','I built a web application that tracks attendance.','Be specific: say what you built and what it does.',4),
 ('How should you end a self introduction in an interview?','["That''s all.","Finished.","Thank you for giving me this opportunity.","Nothing more."]','Thank you for giving me this opportunity.','A polite closing leaves a strong final impression.',5)
) AS e(q,options,a,exp,ord)
WHERE l.day_number = 1 AND l.week_number = 1;

-- SEED: 20 translation sentences for Day 1
INSERT INTO public.translation_sentences (lesson_id, hindi, english, category, sort_order)
SELECT l.id, t.hi, t.en, t.cat, t.ord
FROM public.lessons l,
(VALUES
 ('मेरा नाम रोहन है और मैं कंप्यूटर साइंस का छात्र हूँ।','My name is Rohan and I am a Computer Science student.','college',1),
 ('मैं तीसरे साल में पढ़ रहा हूँ।','I am studying in the third year.','college',2),
 ('मुझे वेब डेवलपमेंट में दिलचस्पी है।','I am interested in web development.','coding',3),
 ('मैं रोज़ एक घंटा अंग्रेज़ी का अभ्यास करता हूँ।','I practise English for one hour every day.','daily life',4),
 ('क्या आप मुझे यह कॉन्सेप्ट फिर से समझा सकते हैं?','Could you explain this concept again, please?','college',5),
 ('मैं अभी अपने प्रोजेक्ट पर काम कर रहा हूँ।','I am currently working on my project.','projects',6),
 ('इस फंक्शन में एक छोटी सी गलती है।','There is a small mistake in this function.','coding',7),
 ('मैंने कल यह बग ठीक कर दिया था।','I fixed this bug yesterday.','coding',8),
 ('मुझे इस असाइनमेंट के लिए दो दिन और चाहिए।','I need two more days for this assignment.','college',9),
 ('मैं इंटर्नशिप की तैयारी कर रहा हूँ।','I am preparing for an internship.','interviews',10),
 ('क्या हम कल इस पर चर्चा कर सकते हैं?','Can we discuss this tomorrow?','meetings',11),
 ('मैंने रिपोर्ट ईमेल पर भेज दी है।','I have sent the report over email.','office',12),
 ('मुझे आपकी मदद की ज़रूरत है।','I need your help.','daily life',13),
 ('टीम अगले हफ्ते फीचर लॉन्च करेगी।','The team will launch the feature next week.','office',14),
 ('क्लाइंट ने कुछ बदलाव मांगे हैं।','The client has requested a few changes.','client communication',15),
 ('मैं मीटिंग में पाँच मिनट देर से आऊँगा।','I will be five minutes late for the meeting.','meetings',16),
 ('मुझे अपनी संचार क्षमता सुधारनी है।','I want to improve my communication skills.','interviews',17),
 ('यह प्रोजेक्ट रिएक्ट और नोड पर बना है।','This project is built with React and Node.','projects',18),
 ('मैं आज लैपटॉप पर काम शुरू कर रहा हूँ।','I am starting work on my laptop today.','daily life',19),
 ('इस अवसर के लिए धन्यवाद।','Thank you for this opportunity.','interviews',20)
) AS t(hi,en,cat,ord)
WHERE l.day_number = 1 AND l.week_number = 1;

-- SEED: resources
INSERT INTO public.resources (title,type,category,content,difficulty,module_number) VALUES
('Leave request email to your professor','template','emails','Subject: Leave Request for 12 March\n\nDear Professor Sharma,\n\nI hope you are doing well. I would like to request leave for 12 March as I have a medical appointment. I have completed the pending assignment and will share it before the deadline.\n\nThank you for your understanding.\n\nBest regards,\nRohan Sharma\nB.Tech CSE, Semester 5','beginner',4),
('Internship application email','template','emails','Subject: Application for Software Development Internship\n\nDear Hiring Team,\n\nI am a third-year Computer Science student with experience in React and Node.js. I have built two full-stack projects, including an attendance tracking application. I would like to apply for the summer internship at your company.\n\nMy resume is attached for your reference. Thank you for your time.\n\nBest regards,\nRohan Sharma','beginner',4),
('Follow-up email after an interview','template','emails','Subject: Thank You — Software Engineer Interview\n\nDear Ms. Iyer,\n\nThank you for taking the time to speak with me today. I enjoyed our discussion about the payments team and the challenges you are solving.\n\nIf you need any further information from my side, please let me know.\n\nBest regards,\nRohan Sharma','intermediate',4),
('Tell me about yourself — structure and sample','guide','interview','Structure: Present (who you are) → Past (what you have done) → Future (what you want next).\n\nSample: "I am a third-year Computer Science student at DTI. Over the last two years I have built two full-stack projects and completed a backend internship. I am now looking for a role where I can work on scalable backend systems."','beginner',6),
('Explaining your code in an interview','guide','interview','Use this order: 1) What the code does, 2) Why you chose this approach, 3) Complexity, 4) Trade-offs.\n\nPhrases: "Let me walk you through the logic.", "I used a hash map because lookups are O(1).", "One trade-off here is extra memory usage."','intermediate',7),
('Group discussion opening and closing phrases','guide','gd','Opening: "I would like to begin by highlighting...", "Let me start with a quick perspective on..."\nAgreeing: "I agree with Priya, and I would like to add..."\nDisagreeing politely: "I see your point, however..."\nConcluding: "To summarise, the group broadly agrees that..."','intermediate',8),
('GD topics for CSE students','list','gd','1. Is AI a threat to entry-level software jobs?\n2. Should coding be taught in every school?\n3. Remote work vs office work for freshers\n4. Open source contribution vs personal projects\n5. Is a CS degree still necessary in 2026?','intermediate',8),
('Presentation transition phrases','guide','presentation','"Let me start with the problem we identified."\n"Moving on to the architecture..."\n"This slide shows the results of our testing."\n"To wrap up, here are the three key takeaways."\n"I would be happy to take any questions."','intermediate',9),
('Daily standup phrases','guide','professional','Yesterday: "Yesterday I completed the login API."\nToday: "Today I will work on the payment integration."\nBlockers: "I am blocked on the staging credentials."\nAsking: "Could you clarify the expected response format?"','beginner',12),
('LinkedIn headline formulas','guide','professional','Formula 1: [Role] | [Tech stack] | [What you build]\nExample: CSE Undergraduate | React, Node.js, PostgreSQL | Building full-stack web products\n\nFormula 2: Aspiring [Role] helping [who] with [what]\nExample: Aspiring Backend Engineer | Building scalable APIs | Open to Summer 2026 internships','intermediate',13),
('Resume action verbs for CSE students','list','professional','Built, Designed, Implemented, Optimised, Automated, Integrated, Migrated, Reduced, Improved, Led, Collaborated, Debugged, Deployed, Tested, Documented','beginner',14),
('Client status update template','template','professional','Subject: Weekly Status Update — Project Atlas\n\nHi Team,\n\nProgress this week: user authentication and dashboard completed.\nIn progress: reporting module (70% done).\nBlockers: awaiting API credentials from your side.\nNext week: complete reporting and begin testing.\n\nHappy to discuss on a call if useful.\n\nBest regards,\nRohan','intermediate',10);

-- SEED: live sessions
INSERT INTO public.live_sessions (title, description, mentor_name, session_date, session_time, status) VALUES
('Speak Without Fear: Weekly Speaking Circle','Open speaking practice with structured prompts for CSE students.','Mentor Team', CURRENT_DATE + 3, '19:00','upcoming'),
('Mock HR Interview Clinic','Live mock interviews with feedback on structure and clarity.','Mentor Team', CURRENT_DATE + 7, '18:30','upcoming'),
('Explaining Your Project in 2 Minutes','Learn the Problem-Solution-Stack-Role framework and practise live.','Mentor Team', CURRENT_DATE + 10, '20:00','upcoming');
