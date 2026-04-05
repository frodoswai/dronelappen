-- Categories (A1/A3, A2, etc.)
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('A1_A3', 'A2')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Questions
CREATE TABLE questions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES categories(id),
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_option_id TEXT NOT NULL,
  explanation TEXT,
  difficulty INTEGER DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 3),
  exam_type TEXT NOT NULL CHECK (exam_type IN ('A1_A3', 'A2')),
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- User progress
CREATE TABLE user_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  question_id UUID REFERENCES questions(id),
  selected_option_id TEXT NOT NULL,
  is_correct BOOLEAN NOT NULL,
  answered_at TIMESTAMPTZ DEFAULT now()
);

-- Quiz sessions
CREATE TABLE quiz_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  exam_type TEXT NOT NULL CHECK (exam_type IN ('A1_A3', 'A2')),
  total_questions INTEGER NOT NULL DEFAULT 30,
  correct_answers INTEGER DEFAULT 0,
  passed BOOLEAN,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- RLS + Policies + Indexes
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories are viewable by everyone" ON categories FOR SELECT USING (true);
CREATE POLICY "Questions are viewable by everyone" ON questions FOR SELECT USING (true);
CREATE POLICY "Users manage own progress" ON user_progress FOR ALL USING (true);
CREATE POLICY "Users manage own sessions" ON quiz_sessions FOR ALL USING (true);
CREATE INDEX idx_questions_exam_type ON questions(exam_type);
CREATE INDEX idx_questions_category ON questions(category_id);
CREATE INDEX idx_progress_user ON user_progress(user_id);
CREATE INDEX idx_sessions_user ON quiz_sessions(user_id);
