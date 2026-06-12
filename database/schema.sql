CREATE DATABASE IF NOT EXISTS internship_accelerator
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE internship_accelerator;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  account VARCHAR(100) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  identity ENUM('student', 'enterprise', 'admin') NOT NULL DEFAULT 'student',
  name VARCHAR(100) NOT NULL DEFAULT '',
  school VARCHAR(100),
  major VARCHAR(100),
  phone VARCHAR(30),
  email VARCHAR(120),
  avatar VARCHAR(255),
  skill_professional VARCHAR(20),
  skill_language VARCHAR(20),
  skill_soft VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_identity (identity)
);

CREATE TABLE IF NOT EXISTS assessment_results (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  major VARCHAR(100),
  skill_level VARCHAR(50),
  experience TEXT,
  career_goal VARCHAR(255),
  match_percent INT NOT NULL,
  professional_score INT NOT NULL,
  practical_score INT NOT NULL,
  communication_score INT NOT NULL,
  teamwork_score INT NOT NULL,
  innovation_score INT NOT NULL,
  suggestions JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_assessment_user_created (user_id, created_at)
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  role ENUM('user', 'ai') NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_chat_user_created (user_id, created_at)
);

CREATE TABLE IF NOT EXISTS programs (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  level ENUM('初级', '中级', '高级') NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  duration VARCHAR(50),
  image VARCHAR(255),
  description TEXT,
  features JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_programs_level (level)
);

CREATE TABLE IF NOT EXISTS program_enrollments (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  program_id BIGINT NOT NULL,
  status ENUM('active', 'completed', 'cancelled') NOT NULL DEFAULT 'active',
  enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (program_id) REFERENCES programs(id) ON DELETE CASCADE,
  UNIQUE KEY uniq_user_program (user_id, program_id)
);

CREATE TABLE IF NOT EXISTS training_projects (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  duration VARCHAR(50),
  difficulty ENUM('初级', '中级', '高级') NOT NULL DEFAULT '初级',
  content TEXT,
  image VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_training_projects_category (category)
);

CREATE TABLE IF NOT EXISTS training_sessions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  project_id BIGINT,
  topic VARCHAR(200) NOT NULL,
  content TEXT,
  duration VARCHAR(50),
  category VARCHAR(50),
  difficulty VARCHAR(50),
  status ENUM('started', 'completed') NOT NULL DEFAULT 'completed',
  suggestion TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES training_projects(id) ON DELETE SET NULL,
  INDEX idx_training_sessions_user_created (user_id, created_at)
);

CREATE TABLE IF NOT EXISTS interview_questions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  question TEXT NOT NULL,
  category VARCHAR(100),
  frequency ENUM('必问', '高频', '常见') NOT NULL DEFAULT '常见',
  answer TEXT,
  type VARCHAR(100),
  tags JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_interview_questions_category (category),
  INDEX idx_interview_questions_frequency (frequency)
);

CREATE TABLE IF NOT EXISTS interview_sessions (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  interview_type VARCHAR(100),
  industry VARCHAR(100),
  answers JSON,
  score INT NOT NULL,
  strengths JSON,
  improvements JSON,
  breakdown JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_interview_sessions_user_created (user_id, created_at)
);

CREATE TABLE IF NOT EXISTS notifications (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(200) NOT NULL,
  content TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notifications_user_created (user_id, created_at),
  INDEX idx_notifications_user_read (user_id, is_read)
);

CREATE TABLE IF NOT EXISTS certificates (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  title VARCHAR(200) NOT NULL,
  issuer VARCHAR(100),
  cert_date DATE,
  cert_no VARCHAR(100),
  image VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_certificates_user (user_id)
);
