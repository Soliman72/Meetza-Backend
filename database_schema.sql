-- =============================================
-- Meetza Backend Database Schema
-- MySQL Database Creation Script
-- =============================================

-- Create database (if it doesn't exist)
CREATE DATABASE IF NOT EXISTS meetza CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE meetza;

-- =============================================
-- 1. USER TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS `user` (
    `id` VARCHAR(36) PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `email` VARCHAR(255) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('Administrator', 'Super_Admin', 'Member') NOT NULL,
    `verification_code` VARCHAR(4) NULL,
    `email_verification` BOOLEAN DEFAULT FALSE,
    `user_photo` TEXT NULL,
    `theme` ENUM('light', 'dark', 'blue', 'green') DEFAULT 'light',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_email` (`email`),
    INDEX `idx_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 2. ADMINISTRATOR TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS `administrator` (
    `user_id` VARCHAR(36) PRIMARY KEY,
    `role` ENUM('Administrator', 'Super_Admin') NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_administrator_user` 
        FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 3. MEMBER TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS `member` (
    `user_id` VARCHAR(36) PRIMARY KEY,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_member_user` 
        FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 4. POSITION TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS `position` (
    `id` VARCHAR(36) PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `administrator_id` VARCHAR(36) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_administrator_id` (`administrator_id`),
    CONSTRAINT `fk_position_administrator` 
        FOREIGN KEY (`administrator_id`) REFERENCES `user`(`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 5. GROUP CONTENT TABLE
-- Note: group_id foreign key will be added after group table is created
-- =============================================
CREATE TABLE IF NOT EXISTS `group_content` (
    `id` VARCHAR(36) PRIMARY KEY,
    `content_name` VARCHAR(255) NOT NULL,
    `content_description` TEXT NULL,
    `group_id` VARCHAR(36) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_group_id` (`group_id`),
    CONSTRAINT `fk_group_content_group` 
        FOREIGN KEY (`group_id`) REFERENCES `group`(`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 6. GROUP CONTENT RESOURCE TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS `group_content_resource` (
    `id` VARCHAR(36) PRIMARY KEY,
    `group_content_id` VARCHAR(36) NOT NULL,
    `file_url` TEXT NOT NULL,
    `file_name` VARCHAR(255) NOT NULL,
    `file_type` VARCHAR(255) NOT NULL,
    `file_size` BIGINT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_group_content_id` (`group_content_id`),
    CONSTRAINT `fk_group_content_resource_content` 
        FOREIGN KEY (`group_content_id`) REFERENCES `group_content`(`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 7. GROUP TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS `group` (
    `id` VARCHAR(36) PRIMARY KEY,
    `group_name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `group_photo` TEXT NULL,
    `year` ENUM('1', '2', '3', '4') NOT NULL,
    `semester` ENUM('Fall', 'Spring', 'Summer') NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX `idx_position_id` (`position_id`),
    INDEX `idx_year_semester` (`year`, `semester`),
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 8. GROUP MEMBERSHIP TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS `group_membership` (
    `id` VARCHAR(36) PRIMARY KEY,
    `group_id` VARCHAR(36) NOT NULL,
    `member_id` VARCHAR(36) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `unique_group_member` (`group_id`, `member_id`),
    INDEX `idx_group_id` (`group_id`),
    INDEX `idx_member_id` (`member_id`),
    CONSTRAINT `fk_group_membership_group` 
        FOREIGN KEY (`group_id`) REFERENCES `group`(`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT `fk_group_membership_member` 
        FOREIGN KEY (`member_id`) REFERENCES `member`(`user_id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- =============================================
CREATE TABLE IF NOT EXISTS `meeting` (
    `id` VARCHAR(36) PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `start_time` DATETIME NOT NULL,
    `end_time` DATETIME NOT NULL,
    `status` ENUM('Scheduled', 'Completed', 'Cancelled') NOT NULL,
    `group_id` VARCHAR(36) NOT NULL,
    `is_weekly` TINYINT(1) NOT NULL DEFAULT 0,
    `series_id` VARCHAR(36) NULL DEFAULT NULL,
    `poster_url` TEXT NULL,
    `description` TEXT NULL,
    `recording` VARCHAR(1) NOT NULL DEFAULT '0',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_group_id` (`group_id`),
    INDEX `idx_meeting_series_id` (`series_id`),
    INDEX `idx_start_time` (`start_time`),
    INDEX `idx_end_time` (`end_time`),
    INDEX `idx_status` (`status`),
    CONSTRAINT `fk_meeting_group` 
        FOREIGN KEY (`group_id`) REFERENCES `group`(`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 9a. MEETING SERIES (weekly recurrence template; id matches meeting.series_id)
-- =============================================
CREATE TABLE IF NOT EXISTS `meeting_series` (
    `id` VARCHAR(36) PRIMARY KEY,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `group_id` VARCHAR(36) NOT NULL,
    `original_meeting_id` VARCHAR(36) NULL,
    `template_title` VARCHAR(255) NOT NULL,
    `template_poster_url` TEXT NULL,
    `template_description` TEXT NULL,
    `template_recording` VARCHAR(1) NOT NULL DEFAULT '0',
    `duration_ms` INT UNSIGNED NOT NULL,
    `day_of_week` TINYINT NOT NULL COMMENT '0=Sunday .. 6=Saturday (node-schedule)',
    `start_hour` TINYINT UNSIGNED NOT NULL,
    `start_minute` TINYINT UNSIGNED NOT NULL,
    `start_second` TINYINT UNSIGNED NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_meeting_series_active` (`is_active`),
    INDEX `idx_meeting_series_group` (`group_id`),
    CONSTRAINT `fk_meeting_series_group`
        FOREIGN KEY (`group_id`) REFERENCES `group`(`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT `fk_meeting_series_original_meeting`
        FOREIGN KEY (`original_meeting_id`) REFERENCES `meeting`(`id`)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 9b. MEETING PARTICIPANT TABLE (members in a meeting)
-- =============================================
CREATE TABLE IF NOT EXISTS `meeting_participant` (
    `id` VARCHAR(36) PRIMARY KEY,
    `meeting_id` VARCHAR(36) NOT NULL,
    `member_id` VARCHAR(36) NOT NULL,
    `joined_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `unique_meeting_member` (`meeting_id`, `member_id`),
    INDEX `idx_meeting_id` (`meeting_id`),
    INDEX `idx_member_id` (`member_id`),
    CONSTRAINT `fk_meeting_participant_meeting` 
        FOREIGN KEY (`meeting_id`) REFERENCES `meeting`(`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT `fk_meeting_participant_member` 
        FOREIGN KEY (`member_id`) REFERENCES `member`(`user_id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 10. VIDEO TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS `video` (
    `id` VARCHAR(36) PRIMARY KEY,
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL UNIQUE,
    `meeting_id` VARCHAR(36) NULL,
    `video_url` TEXT NOT NULL,
    `poster_url` TEXT NULL,
    `administrator_id` VARCHAR(36) NOT NULL,
    `duration` TIME NOT NULL,
    `description` TEXT NULL,
    `group_id` VARCHAR(36) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_meeting_id` (`meeting_id`),
    INDEX `idx_administrator_id` (`administrator_id`),
    INDEX `idx_group_id` (`group_id`),
    INDEX `idx_slug` (`slug`),
    INDEX `idx_duration` (`duration`),
    CONSTRAINT `fk_video_meeting` 
        FOREIGN KEY (`meeting_id`) REFERENCES `meeting`(`id`) 
        ON DELETE SET NULL 
        ON UPDATE CASCADE,
    CONSTRAINT `fk_video_administrator` 
        FOREIGN KEY (`administrator_id`) REFERENCES `user`(`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT `fk_video_group` 
        FOREIGN KEY (`group_id`) REFERENCES `group`(`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 10a. VIDEO TRANSCRIPT & SUMMARY TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS `video_transcript_summary` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `video_id` VARCHAR(36) NOT NULL,
    `language` VARCHAR(10) NOT NULL,
    `transcript` LONGTEXT NULL,
    `summary` LONGTEXT NULL,
    `topics` LONGTEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_video_language` (`video_id`, `language`),
    INDEX `idx_video_id` (`video_id`),
    INDEX `idx_language` (`language`),
    CONSTRAINT `fk_video_transcript_summary_video`
        FOREIGN KEY (`video_id`) REFERENCES `video`(`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 11. COMMENT TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS `comment` (
    `id` VARCHAR(36) PRIMARY KEY,
    `member_id` VARCHAR(36) NOT NULL,
    `video_id` VARCHAR(36) NOT NULL,
    `parent_id` VARCHAR(36) NULL,
    `comment_text` TEXT NOT NULL,
    `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_member_id` (`member_id`),
    INDEX `idx_video_id` (`video_id`),
    INDEX `idx_parent_id` (`parent_id`),
    INDEX `idx_timestamp` (`timestamp`),
    CONSTRAINT `fk_comment_member` 
        FOREIGN KEY (`member_id`) REFERENCES `member`(`user_id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT `fk_comment_video` 
        FOREIGN KEY (`video_id`) REFERENCES `video`(`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT `fk_comment_parent` 
        FOREIGN KEY (`parent_id`) REFERENCES `comment`(`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 12. LIKE TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS `like` (
    `id` VARCHAR(36) PRIMARY KEY,
    `member_id` VARCHAR(36) NOT NULL,
    `video_id` VARCHAR(36) NOT NULL,
    `like_type` TINYINT(1) NOT NULL COMMENT '0 = dislike, 1 = like',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `unique_member_video_like` (`member_id`, `video_id`),
    INDEX `idx_member_id` (`member_id`),
    INDEX `idx_video_id` (`video_id`),
    INDEX `idx_like_type` (`like_type`),
    CONSTRAINT `fk_like_member` 
        FOREIGN KEY (`member_id`) REFERENCES `member`(`user_id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT `fk_like_video` 
        FOREIGN KEY (`video_id`) REFERENCES `video`(`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 13. SAVED VIDEO TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS `saved_video` (
    `member_id` VARCHAR(36) NOT NULL,
    `video_id` VARCHAR(36) NOT NULL,
    `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`member_id`, `video_id`),
    INDEX `idx_member_id` (`member_id`),
    INDEX `idx_video_id` (`video_id`),
    INDEX `idx_timestamp` (`timestamp`),
    CONSTRAINT `fk_saved_video_member` 
        FOREIGN KEY (`member_id`) REFERENCES `member`(`user_id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT `fk_saved_video_video` 
        FOREIGN KEY (`video_id`) REFERENCES `video`(`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 13a. VIDEO WATCH PROGRESS (per user; home "Watching" / "Completed")
-- =============================================
CREATE TABLE IF NOT EXISTS `video_watch_progress` (
    `user_id` VARCHAR(36) NOT NULL,
    `video_id` VARCHAR(36) NOT NULL,
    `progress_seconds` INT UNSIGNED NOT NULL DEFAULT 0,
    `completed` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 = user finished or marked complete',
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`user_id`, `video_id`),
    INDEX `idx_video_watch_progress_video` (`video_id`),
    CONSTRAINT `fk_video_watch_progress_user`
        FOREIGN KEY (`user_id`) REFERENCES `user`(`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT `fk_video_watch_progress_video`
        FOREIGN KEY (`video_id`) REFERENCES `video`(`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 14. NOTIFICATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS `notifications` (
    `id` VARCHAR(36) PRIMARY KEY,
    `member_id` VARCHAR(36) NOT NULL,
    `sender_id` VARCHAR(36) NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `message` TEXT NOT NULL,
    `is_read` TINYINT(1) DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_member_id` (`member_id`),
    INDEX `idx_sender_id` (`sender_id`),
    INDEX `idx_is_read` (`is_read`),
    INDEX `idx_created_at` (`created_at`),
    CONSTRAINT `fk_notifications_member` 
        FOREIGN KEY (`member_id`) REFERENCES `member`(`user_id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT `fk_notifications_sender` 
        FOREIGN KEY (`sender_id`) REFERENCES `user`(`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 15. GROUP MESSAGE TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS `group_message` (
    `id` VARCHAR(36) PRIMARY KEY,
    `group_id` VARCHAR(36) NOT NULL,
    `sender_id` VARCHAR(36) NOT NULL,
    `message` TEXT NULL,
    `parent_message_id` VARCHAR(36) NULL DEFAULT NULL COMMENT 'NULL = top-level; set = reply to another message',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_group_id` (`group_id`),
    INDEX `idx_sender_id` (`sender_id`),
    INDEX `idx_created_at` (`created_at`),
    INDEX `idx_parent_message_id` (`parent_message_id`),
    CONSTRAINT `fk_group_message_group` 
        FOREIGN KEY (`group_id`) REFERENCES `group`(`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT `fk_group_message_sender` 
        FOREIGN KEY (`sender_id`) REFERENCES `user`(`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT `fk_group_message_parent`
        FOREIGN KEY (`parent_message_id`) REFERENCES `group_message`(`id`)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 16. GROUP MESSAGE MEDIA TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS `group_message_media` (
    `id` VARCHAR(36) PRIMARY KEY,
    `group_id` VARCHAR(36) NOT NULL,
    `sender_id` VARCHAR(36) NOT NULL,
    `message_id` VARCHAR(36) NOT NULL,
    `file_name` VARCHAR(255) NOT NULL,
    `media_url` TEXT NOT NULL,
    `media_type` ENUM('image', 'voice', 'file', 'link') NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_group_id` (`group_id`),
    INDEX `idx_sender_id` (`sender_id`),
    INDEX `idx_message_id` (`message_id`),
    CONSTRAINT `fk_group_message_media_group` 
        FOREIGN KEY (`group_id`) REFERENCES `group`(`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT `fk_group_message_media_sender` 
        FOREIGN KEY (`sender_id`) REFERENCES `user`(`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT `fk_group_message_media_message` 
        FOREIGN KEY (`message_id`) REFERENCES `group_message`(`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 17. MESSAGE READ STATUS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS `message_read_status` (
    `id` VARCHAR(36) PRIMARY KEY,
    `message_id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `is_read` TINYINT(1) DEFAULT 0 COMMENT '0 = unread, 1 = read',
    `read_at` TIMESTAMP NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `unique_message_user` (`message_id`, `user_id`),
    INDEX `idx_message_id` (`message_id`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_is_read` (`is_read`),
    INDEX `idx_read_at` (`read_at`),
    CONSTRAINT `fk_message_read_status_message` 
        FOREIGN KEY (`message_id`) REFERENCES `group_message`(`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE,
    CONSTRAINT `fk_message_read_status_user` 
        FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 18. SOCIAL AUTH TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS `social_auth` (
    `id` VARCHAR(36) PRIMARY KEY,
    `user_id` VARCHAR(36) NOT NULL,
    `provider` VARCHAR(50) NOT NULL,
    `provider_id` VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `unique_provider_provider_id` (`provider`, `provider_id`),
    INDEX `idx_user_id` (`user_id`),
    INDEX `idx_provider` (`provider`),
    CONSTRAINT `fk_social_auth_user` 
        FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- END OF SCHEMA
-- =============================================

-- =============================================
-- 19. GROUP ADMIN TABLE (multi-admin per group)
-- =============================================
CREATE TABLE IF NOT EXISTS `group_admin` (
    `id` VARCHAR(36) PRIMARY KEY,
    `group_id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `role` ENUM('OWNER', 'ADMIN') NOT NULL DEFAULT 'ADMIN',
    `assigned_by` VARCHAR(36) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `unique_group_admin` (`group_id`, `user_id`),
    INDEX `idx_group_admin_group_id` (`group_id`),
    INDEX `idx_group_admin_user_id` (`user_id`),
    CONSTRAINT `fk_group_admin_group`
        FOREIGN KEY (`group_id`) REFERENCES `group`(`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT `fk_group_admin_user`
        FOREIGN KEY (`user_id`) REFERENCES `user`(`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT `fk_group_admin_assigned_by`
        FOREIGN KEY (`assigned_by`) REFERENCES `user`(`id`)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 20. MEETING ADMIN TABLE (multi-admin per meeting)
-- =============================================
CREATE TABLE IF NOT EXISTS `meeting_admin` (
    `id` VARCHAR(36) PRIMARY KEY,
    `meeting_id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `role` ENUM('OWNER', 'ADMIN') NOT NULL DEFAULT 'ADMIN',
    `assigned_by` VARCHAR(36) NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `unique_meeting_admin` (`meeting_id`, `user_id`),
    INDEX `idx_meeting_admin_meeting_id` (`meeting_id`),
    INDEX `idx_meeting_admin_user_id` (`user_id`),
    CONSTRAINT `fk_meeting_admin_meeting`
        FOREIGN KEY (`meeting_id`) REFERENCES `meeting`(`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT `fk_meeting_admin_user`
        FOREIGN KEY (`user_id`) REFERENCES `user`(`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT `fk_meeting_admin_assigned_by`
        FOREIGN KEY (`assigned_by`) REFERENCES `user`(`id`)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 21. MESSAGE REACTION TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS `message_reaction` (
    `id`         VARCHAR(36) NOT NULL,
    `message_id` VARCHAR(36) NOT NULL,
    `user_id`    VARCHAR(36) NOT NULL,
    `emoji`      VARCHAR(20) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_message_user` (`message_id`, `user_id`),
    INDEX `idx_reaction_message_id` (`message_id`),
    INDEX `idx_reaction_user_id`    (`user_id`),
    CONSTRAINT `fk_reaction_message`
        FOREIGN KEY (`message_id`) REFERENCES `group_message`(`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT `fk_reaction_user`
        FOREIGN KEY (`user_id`) REFERENCES `user`(`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 22. ORGANIZATION DOMAIN TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS `organization_domain` (
    `id` VARCHAR(36) PRIMARY KEY,
    `domain_name` VARCHAR(255) NOT NULL UNIQUE,
    `auth_email_enabled` BOOLEAN DEFAULT TRUE,
    `auth_google_enabled` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

