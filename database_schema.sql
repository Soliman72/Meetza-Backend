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
    `theme` ENUM('light', 'dark') DEFAULT 'light',
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
-- 9. MEETING TABLE
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
-- 10. MEETING SERIES (weekly recurrence template; id matches meeting.series_id)
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
-- 11. MEETING PARTICIPANT TABLE (members in a meeting)
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
-- 12. VIDEO TRANSCRIPT & SUMMARY TABLE
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
-- 13. RESOURCE AI METADATA TABLE (for PDFs, etc.)
-- =============================================
CREATE TABLE IF NOT EXISTS `resource_ai_metadata` (
    `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    `resource_id` VARCHAR(36) NOT NULL,
    `language` VARCHAR(10) NOT NULL,
    `transcript` LONGTEXT NULL,
    `summary` LONGTEXT NULL,
    `topics` LONGTEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `unique_resource_language` (`resource_id`, `language`),
    INDEX `idx_resource_id` (`resource_id`),
    INDEX `idx_language` (`language`),
    CONSTRAINT `fk_resource_ai_metadata_resource`
        FOREIGN KEY (`resource_id`) REFERENCES `group_content_resource`(`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 14. COMMENT TABLE
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
-- 15. LIKE TABLE
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
-- 16. SAVED VIDEO TABLE
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
-- 17. VIDEO WATCH PROGRESS (per user; home "Watching" / "Completed")
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
-- 18. NOTIFICATIONS TABLE
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
-- 19. NOTIFICATION PENDING GROUP ACTION TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS `notification_pending_group_action` (
    `notification_id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `pending_group_id` VARCHAR(36) NOT NULL,
    `approve_url` TEXT NOT NULL,
    `reject_url` TEXT NOT NULL,
    `status` VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT 'pending | approved | rejected — mirrors pending_groups until resolved',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_npga_pending_group` (`pending_group_id`),
    CONSTRAINT `fk_npga_notification`
        FOREIGN KEY (`notification_id`) REFERENCES `notifications`(`id`)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 20. GROUP MESSAGE TABLE
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
-- 21. GROUP MESSAGE MEDIA TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS `group_message_media` (
    `id` VARCHAR(36) PRIMARY KEY,
    `group_id` VARCHAR(36) NOT NULL,
    `sender_id` VARCHAR(36) NOT NULL,
    `message_id` VARCHAR(36) NOT NULL,
    `file_name` VARCHAR(255) NOT NULL,
    `media_url` TEXT NOT NULL,
    `media_type` ENUM('image', 'voice', 'video', 'file', 'link') NOT NULL,
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
-- 22. MESSAGE READ STATUS TABLE
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
-- 23. SOCIAL AUTH TABLE
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
-- 24. GROUP ADMIN TABLE (multi-admin per group)
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
-- 25. MEETING ADMIN TABLE (multi-admin per meeting)
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
-- 26. MESSAGE REACTION TABLE
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
-- 27. COMPANIES & PER-COMPANY SETTINGS (multi-tenant; before organization_domain FK)
-- =============================================
CREATE TABLE IF NOT EXISTS `companies` (
    `id` VARCHAR(36) PRIMARY KEY,
    `name` VARCHAR(255) NOT NULL,
    `is_active` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_companies_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 28. COMPANY SETTINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS `company_settings` (
    `company_id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `system_name` VARCHAR(255) NOT NULL DEFAULT 'Meetza',
    `logo_url` TEXT NULL,
    `system_name_color` VARCHAR(7) NOT NULL
    `theme` ENUM('light', 'dark') NOT NULL DEFAULT 'light' COMMENT 'light = white UI, dark = black UI',
    `terms_html` LONGTEXT NULL,
    `privacy_html` LONGTEXT NULL,
    `guidelines_html` LONGTEXT NULL,
    `auth_email_enabled` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Default when organization_domain row has NULL auth override',
    `auth_google_enabled` TINYINT(1) NOT NULL DEFAULT 1,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_company_settings_company`
        FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 29. ORGANIZATION DOMAIN TABLE (all domains: global legacy rows company_id NULL, or linked to a company)
-- =============================================
CREATE TABLE IF NOT EXISTS `organization_domain` (
    `id` VARCHAR(36) PRIMARY KEY,
    `company_id` VARCHAR(36) NULL COMMENT 'NULL = legacy/global domain; set when domain belongs to a company',
    `domain_name` VARCHAR(255) NOT NULL,
    `auth_email_enabled` TINYINT(1) NULL DEFAULT NULL COMMENT 'NULL with company_id = inherit company_settings; else explicit or default 1',
    `auth_google_enabled` TINYINT(1) NULL DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY `uk_organization_domain_name` (`domain_name`),
    INDEX `idx_organization_domain_company` (`company_id`),
    CONSTRAINT `fk_organization_domain_company`
        FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 30. PENDING GROUP TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS `pending_groups` (
    `id` VARCHAR(36) PRIMARY KEY,
    `group_name` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `group_photo` TEXT NULL,
    `year` ENUM('1', '2', '3', '4') NOT NULL,
    `semester` ENUM('Fall', 'Spring', 'Summer') NOT NULL,
    `created_by` VARCHAR(36) NOT NULL,
    `status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    `approved_by` VARCHAR(36) NULL,
    `approved_at` TIMESTAMP NULL,
    `rejected_by` VARCHAR(36) NULL,
    `rejected_at` TIMESTAMP NULL,
    `rejection_reason` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_created_by` (`created_by`),
    INDEX `idx_status` (`status`),
    CONSTRAINT `fk_pending_groups_created_by`
        FOREIGN KEY (`created_by`) REFERENCES `user`(`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT `fk_pending_groups_approved_by`
        FOREIGN KEY (`approved_by`) REFERENCES `user`(`id`)
        ON DELETE SET NULL
        ON UPDATE CASCADE,
    CONSTRAINT `fk_pending_groups_rejected_by`
        FOREIGN KEY (`rejected_by`) REFERENCES `user`(`id`)
        ON DELETE SET NULL
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 31. PENDING GROUP ADMIN TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS `pending_group_admins` (
    `id` VARCHAR(36) PRIMARY KEY,
    `pending_group_id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `role` ENUM('OWNER', 'ADMIN') NOT NULL DEFAULT 'ADMIN',
    `assigned_by` VARCHAR(36) NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `unique_pending_group_admin` (`pending_group_id`, `user_id`),
    INDEX `idx_pending_group_admin_pending_group_id` (`pending_group_id`),
    INDEX `idx_pending_group_admin_user_id` (`user_id`),
    CONSTRAINT `fk_pending_group_admin_pending_group`
        FOREIGN KEY (`pending_group_id`) REFERENCES `pending_groups`(`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT `fk_pending_group_admin_user`
        FOREIGN KEY (`user_id`) REFERENCES `user`(`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE,
    CONSTRAINT `fk_pending_group_admin_assigned_by`
        FOREIGN KEY (`assigned_by`) REFERENCES `user`(`id`)
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- 32. CHAT BOT CACHE TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS `chat_bot_cache` (
    `id` VARCHAR(36) NOT NULL PRIMARY KEY,
    `question_key` VARCHAR(512) NOT NULL,
    `normalized_question` TEXT NOT NULL,
    `reply` LONGTEXT NOT NULL,
    `expires_at` DATETIME NOT NULL,
    `hit_count` INT UNSIGNED NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (`id`),
    UNIQUE KEY `uk_chat_bot_cache_question_key` (`question_key`),
    INDEX `idx_chat_bot_cache_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

