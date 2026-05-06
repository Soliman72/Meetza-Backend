DROP DATABASE IF EXISTS meetza;
CREATE DATABASE meetza;
use meetza;

-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 178.63.129.210
-- Generation Time: May 06, 2026 at 03:08 PM
-- Server version: 10.11.15-MariaDB-log
-- PHP Version: 8.2.25

SET FOREIGN_KEY_CHECKS = 0;

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `db34112`
--

-- --------------------------------------------------------

--
-- Table structure for table `administrator`
--

CREATE TABLE `administrator` (
  `user_id` varchar(36) NOT NULL,
  `role` enum('Administrator','Super_Admin') NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `administrator`
--

INSERT INTO `administrator` (`user_id`, `role`, `created_at`, `updated_at`) VALUES
('0264a84d-d735-4e4a-967b-ba67eed05c58', 'Super_Admin', '2025-12-03 19:51:10', '2025-12-03 19:51:10'),
('384b5462-110b-4081-bc67-8768e8516ad7', 'Administrator', '2026-05-03 16:26:50', '2026-05-03 16:26:50'),
('4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Administrator', '2026-05-03 16:55:52', '2026-05-03 16:55:52'),
('62007461-76d0-4d66-803c-df77ba651887', 'Administrator', '2026-05-03 16:55:51', '2026-05-03 16:55:51'),
('64ffcc78-7745-424e-8dda-67e1b847d138', 'Administrator', '2026-05-03 16:55:45', '2026-05-03 16:55:45'),
('72ccdd7d-f991-40c3-850b-35a944f9da41', 'Administrator', '2026-05-03 16:26:52', '2026-05-03 16:26:52'),
('7345e640-af7d-4283-ba5d-b1a2c361ec17', 'Administrator', '2026-05-03 16:26:49', '2026-05-03 16:26:49'),
('9a5becdf-22bd-47de-85c9-f0e66063e379', 'Super_Admin', '2025-12-02 15:37:29', '2025-12-02 21:21:38'),
('ae5c28ed-63d6-4c95-874f-fd2e0108fa26', 'Administrator', '2026-05-03 16:26:50', '2026-05-03 16:26:50'),
('cae09d05-7a25-4714-bd33-2410319f9cc3', 'Super_Admin', '2026-05-03 16:55:45', '2026-05-03 16:55:45'),
('e7beeaa2-4c29-4b3c-b99a-0bda253eaf3d', 'Administrator', '2026-05-03 16:26:51', '2026-05-03 16:26:51'),
('fbe68fee-e732-4f4f-8246-84d966fee0c4', 'Administrator', '2026-05-03 16:26:49', '2026-05-03 16:26:49'),
('fd0ab158-667b-499a-b74d-267a5e102a34', 'Administrator', '2025-12-02 15:39:06', '2025-12-02 15:39:06');

-- --------------------------------------------------------

--
-- Table structure for table `chat_bot_cache`
--

CREATE TABLE `chat_bot_cache` (
  `id` varchar(36) NOT NULL,
  `question_key` varchar(512) NOT NULL,
  `normalized_question` text NOT NULL,
  `reply` longtext NOT NULL,
  `expires_at` datetime NOT NULL,
  `hit_count` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `chat_bot_cache`
--

INSERT INTO `chat_bot_cache` (`id`, `question_key`, `normalized_question`, `reply`, `expires_at`, `hit_count`, `created_at`, `updated_at`) VALUES
('a0e95049-637e-4a34-9f22-8438babd8d2f', '698f27be-f68c-4692-84ba-49ba5fc63769:fuck you', '698f27be-f68c-4692-84ba-49ba5fc63769:fuck you', 'Please adhere to boundaries and ethics.', '2026-05-05 18:58:52', 0, '2026-05-05 16:28:52', '2026-05-05 16:28:52'),
('b4e9022d-46b7-4ae2-b079-b79400fdb891', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf:sorry', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf:sorry', 'I am here to assist you with platform-related queries and navigation regarding Meetza\'s features and content. Please let me know how I can help you today.', '2026-05-05 18:58:42', 0, '2026-05-05 16:28:42', '2026-05-05 16:28:42'),
('ff03395f-abe7-41c2-8378-b03c2ff0c406', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf:fuck u', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf:fuck u', 'Please adhere to boundaries and ethics.', '2026-05-05 18:58:18', 0, '2026-05-05 16:28:18', '2026-05-05 16:28:18');

-- --------------------------------------------------------

--
-- Table structure for table `comment`
--

CREATE TABLE `comment` (
  `id` varchar(36) NOT NULL,
  `member_id` varchar(36) NOT NULL,
  `video_id` varchar(36) NOT NULL,
  `comment_text` text NOT NULL,
  `parent_id` varchar(36) DEFAULT NULL,
  `timestamp` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `companies`
--

CREATE TABLE `companies` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `companies`
--

INSERT INTO `companies` (`id`, `name`, `is_active`, `created_at`, `updated_at`) VALUES
('a0aa8222-a04e-4256-92c6-aa4d1eae55a9', 'Meetza', 1, '2026-05-04 17:40:53', '2026-05-04 17:40:53'),
('b0bff1bc-3d8e-46a1-8263-575f8c981956', 'Qwizzy', 1, '2026-05-03 14:18:45', '2026-05-03 14:18:45'),
('c0633ead-44c9-408f-bcc5-dee7faa8d895', 'Meetza', 1, '2026-05-03 16:55:44', '2026-05-03 16:55:44'),
('dcc465f2-a289-4cc0-96a8-4da15033f42c', 'Meetza', 1, '2026-05-03 16:26:47', '2026-05-03 16:26:47'),
('f0c5d845-9abe-4a37-b77a-e69b68f035b4', 'Meetza', 1, '2026-05-04 17:41:31', '2026-05-04 17:41:31');

-- --------------------------------------------------------

--
-- Table structure for table `company_settings`
--

CREATE TABLE `company_settings` (
  `company_id` varchar(36) NOT NULL,
  `system_name` varchar(255) NOT NULL DEFAULT 'Meetza',
  `logo_url` text DEFAULT NULL,
  `system_name_color` varchar(7) NOT NULL,
  `theme` enum('light','dark') NOT NULL DEFAULT 'light' COMMENT 'light = white UI, dark = black UI',
  `terms_html` longtext DEFAULT NULL,
  `privacy_html` longtext DEFAULT NULL,
  `guidelines_html` longtext DEFAULT NULL,
  `auth_email_enabled` tinyint(1) NOT NULL DEFAULT 1 COMMENT 'Default when organization_domain row has NULL auth override',
  `auth_google_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `company_settings`
--

INSERT INTO `company_settings` (`company_id`, `system_name`, `logo_url`, `system_name_color`, `theme`, `terms_html`, `privacy_html`, `guidelines_html`, `auth_email_enabled`, `auth_google_enabled`, `created_at`, `updated_at`) VALUES
('a0aa8222-a04e-4256-92c6-aa4d1eae55a9', 'Meetza', NULL, '#185A9D', 'light', '<h1>Terms of Service</h1>\n<p><em>Last updated: April 2026</em></p>\n<p>These Terms describe how you can use Meetza. This is a placeholder page that can be expanded later with your official terms.</p>\n<h2>Use of the service</h2>\n<p>Use the app responsibly and follow applicable rules. Do not abuse, disrupt, or attempt to harm the service.</p>\n<h2>Account registration (roles)</h2>\n<p>Leaders are registered by the system team. A leader should provide a seed file that contains the list of leaders accounts to the system supervisor so those accounts can be created.</p>\n<p>Only members can create accounts via the Sign Up flow.</p>', '<h1>Privacy Policy</h1>\n<p><em>Last updated: April 2026</em></p>\n<p>This page explains how Meetza handles personal data. This is a placeholder policy that can be replaced with your final privacy text.</p>\n<h2>What we collect</h2>\n<ul>\n<li>Account information you provide.</li>\n<li>Usage data needed to operate the service.</li>\n</ul>', '<h1>Community Guidelines</h1>\n<p><em>Last updated: April 2026</em></p>\n<p>These guidelines help keep Meetza respectful and productive. This is a placeholder page.</p>\n<h2>Be respectful</h2>\n<p>No harassment, hate speech, or bullying. Respect privacy and consent when sharing content.</p>', 1, 1, '2026-05-04 17:40:54', '2026-05-04 17:40:54'),
('b0bff1bc-3d8e-46a1-8263-575f8c981956', 'Qwizzy', 'https://res.cloudinary.com/dax2irx1f/image/upload/v1777817925/company_logos/e7phe7q4sie1i52ieweh.png', '#2c3e50', 'light', 'These Terms describe how you can use Meetza. This is a placeholder page that can be expanded later with your official terms.\r\n\r\nUse of the service\r\n- Use the app responsibly and follow applicable rules.\r\n- Do not abuse, disrupt, or attempt to harm the service.\r\n\r\nAccount registration (roles)\r\n- Leaders are registered by the system team. An leader should provide a seed file that contains the list of leaders accounts to the system supervisor so those accounts can be created.\r\n- Only members can create accounts via the Sign Up flow.', 'This page explains how Meetza handles personal data. This is a placeholder policy that can be replaced with your final privacy text.\r\n\r\nWhat we collect\r\n- Account information you provide.\r\n- Usage data needed to operate the service.', 'These guidelines help keep Meetza respectful and productive. This is a placeholder page.\r\n\r\nBe respectful\r\n- No harassment, hate speech, or bullying.\r\n- Respect privacy and consent when sharing content.', 1, 1, '2026-05-03 14:18:46', '2026-05-03 14:18:46'),
('c0633ead-44c9-408f-bcc5-dee7faa8d895', 'Meetza', NULL, '#185A9D', 'light', '<h1>Terms of Service</h1>\n<p><em>Last updated: April 2026</em></p>\n<p>These Terms describe how you can use Meetza. This is a placeholder page that can be expanded later with your official terms.</p>\n<h2>Use of the service</h2>\n<p>Use the app responsibly and follow applicable rules. Do not abuse, disrupt, or attempt to harm the service.</p>\n<h2>Account registration (roles)</h2>\n<p>Leaders are registered by the system team. A leader should provide a seed file that contains the list of leaders accounts to the system supervisor so those accounts can be created.</p>\n<p>Only members can create accounts via the Sign Up flow.</p>', '<h1>Privacy Policy</h1>\n<p><em>Last updated: April 2026</em></p>\n<p>This page explains how Meetza handles personal data. This is a placeholder policy that can be replaced with your final privacy text.</p>\n<h2>What we collect</h2>\n<ul>\n<li>Account information you provide.</li>\n<li>Usage data needed to operate the service.</li>\n</ul>', '<h1>Community Guidelines</h1>\n<p><em>Last updated: April 2026</em></p>\n<p>These guidelines help keep Meetza respectful and productive. This is a placeholder page.</p>\n<h2>Be respectful</h2>\n<p>No harassment, hate speech, or bullying. Respect privacy and consent when sharing content.</p>', 1, 1, '2026-05-03 16:55:45', '2026-05-03 16:55:45'),
('dcc465f2-a289-4cc0-96a8-4da15033f42c', 'Meetza', NULL, '#185A9D', 'light', '<h1>Terms of Service</h1>\n<p><em>Last updated: April 2026</em></p>\n<p>These Terms describe how you can use Meetza. This is a placeholder page that can be expanded later with your official terms.</p>\n<h2>Use of the service</h2>\n<p>Use the app responsibly and follow applicable rules. Do not abuse, disrupt, or attempt to harm the service.</p>\n<h2>Account registration (roles)</h2>\n<p>Leaders are registered by the system team. A leader should provide a seed file that contains the list of leaders accounts to the system supervisor so those accounts can be created.</p>\n<p>Only members can create accounts via the Sign Up flow.</p>', '<h1>Privacy Policy</h1>\n<p><em>Last updated: April 2026</em></p>\n<p>This page explains how Meetza handles personal data. This is a placeholder policy that can be replaced with your final privacy text.</p>\n<h2>What we collect</h2>\n<ul>\n<li>Account information you provide.</li>\n<li>Usage data needed to operate the service.</li>\n</ul>', '<h1>Community Guidelines</h1>\n<p><em>Last updated: April 2026</em></p>\n<p>These guidelines help keep Meetza respectful and productive. This is a placeholder page.</p>\n<h2>Be respectful</h2>\n<p>No harassment, hate speech, or bullying. Respect privacy and consent when sharing content.</p>', 1, 1, '2026-05-03 16:26:47', '2026-05-03 16:26:47'),
('f0c5d845-9abe-4a37-b77a-e69b68f035b4', 'Meetza', NULL, '#185A9D', 'light', '<h1>Terms of Service</h1>\n<p><em>Last updated: April 2026</em></p>\n<p>These Terms describe how you can use Meetza. This is a placeholder page that can be expanded later with your official terms.</p>\n<h2>Use of the service</h2>\n<p>Use the app responsibly and follow applicable rules. Do not abuse, disrupt, or attempt to harm the service.</p>\n<h2>Account registration (roles)</h2>\n<p>Leaders are registered by the system team. A leader should provide a seed file that contains the list of leaders accounts to the system supervisor so those accounts can be created.</p>\n<p>Only members can create accounts via the Sign Up flow.</p>', '<h1>Privacy Policy</h1>\n<p><em>Last updated: April 2026</em></p>\n<p>This page explains how Meetza handles personal data. This is a placeholder policy that can be replaced with your final privacy text.</p>\n<h2>What we collect</h2>\n<ul>\n<li>Account information you provide.</li>\n<li>Usage data needed to operate the service.</li>\n</ul>', '<h1>Community Guidelines</h1>\n<p><em>Last updated: April 2026</em></p>\n<p>These guidelines help keep Meetza respectful and productive. This is a placeholder page.</p>\n<h2>Be respectful</h2>\n<p>No harassment, hate speech, or bullying. Respect privacy and consent when sharing content.</p>', 1, 1, '2026-05-04 17:41:31', '2026-05-04 17:41:31');

-- --------------------------------------------------------

--
-- Table structure for table `group`
--

CREATE TABLE `group` (
  `id` varchar(36) NOT NULL,
  `group_name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `group_photo` text DEFAULT NULL,
  `year` enum('1','2','3','4') NOT NULL,
  `semester` enum('Fall','Spring','Summer') NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `group`
--

INSERT INTO `group` (`id`, `group_name`, `description`, `group_photo`, `year`, `semester`, `created_at`, `updated_at`) VALUES
('023d04ae-56bc-44a4-91d6-3da6ecafd7ea', 'COMP305', 'Complexity', 'https://res.cloudinary.com/dax2irx1f/image/upload/v1772145824/posters/n4c2qysd1oxqkzr4te4v.jpg', '3', 'Fall', '2026-05-04 17:41:38', '2026-05-04 17:41:38'),
('06068b96-56e4-42b2-b14d-f0ea5b6daa58', 'COMP 416', 'Data Mining', 'https://res.cloudinary.com/dax2irx1f/image/upload/v1772145824/posters/n4c2qysd1oxqkzr4te4v.jpg', '4', 'Spring', '2026-05-04 17:41:34', '2026-05-04 17:41:34'),
('2b029ef9-10e2-433c-bce2-d4de8b922577', 'COMP307', 'Operating Systems', 'https://res.cloudinary.com/dax2irx1f/image/upload/v1772145824/posters/n4c2qysd1oxqkzr4te4v.jpg', '3', 'Fall', '2026-05-04 17:41:38', '2026-05-04 17:41:38'),
('36f619eb-1250-474f-ad32-8f1dfaed10b0', 'COMP 401', 'AI', 'https://res.cloudinary.com/dax2irx1f/image/upload/v1772145824/posters/n4c2qysd1oxqkzr4te4v.jpg', '4', 'Fall', '2026-05-04 17:41:35', '2026-05-04 17:41:35'),
('536b8acf-ca0d-4ff3-a63c-8038b6ef08cf', 'COMP309', 'Multimedia', 'https://res.cloudinary.com/dax2irx1f/image/upload/v1772145824/posters/n4c2qysd1oxqkzr4te4v.jpg', '3', 'Fall', '2026-05-04 17:41:37', '2026-05-04 17:41:37'),
('6eedbd76-d922-4828-b3dd-2baa9ca82fc4', 'COMP 403', 'Image Processing', 'https://res.cloudinary.com/dax2irx1f/image/upload/v1772145824/posters/n4c2qysd1oxqkzr4te4v.jpg', '4', 'Fall', '2026-05-04 17:41:36', '2026-05-04 17:41:36'),
('83748aba-96f8-4688-bc0f-a81c54bedaf2', 'COMP 408', 'Advanced AI', 'https://res.cloudinary.com/dax2irx1f/image/upload/v1772145824/posters/n4c2qysd1oxqkzr4te4v.jpg', '4', 'Spring', '2026-05-04 17:41:33', '2026-05-04 17:41:33'),
('a6ff89a2-a7ac-4f90-8f8e-2854e2c17bfc', 'COMP 404', 'Software Engineering', 'https://res.cloudinary.com/dax2irx1f/image/upload/v1772145824/posters/n4c2qysd1oxqkzr4te4v.jpg', '4', 'Spring', '2026-05-04 17:41:32', '2026-05-04 17:41:32'),
('ae4bfdaa-2b85-4e71-ba9b-460a9eb7cdf9', 'COMP303', 'Syntax', 'https://res.cloudinary.com/dax2irx1f/image/upload/v1772145824/posters/n4c2qysd1oxqkzr4te4v.jpg', '3', 'Fall', '2026-05-04 17:41:39', '2026-05-04 17:41:39'),
('b6791847-e443-4543-8d51-71863e2929b3', 'COMP301', 'Java Programming', 'https://res.cloudinary.com/dax2irx1f/image/upload/v1772145824/posters/n4c2qysd1oxqkzr4te4v.jpg', '3', 'Fall', '2026-05-04 17:41:40', '2026-05-04 17:41:40'),
('c46c4adb-4934-44a6-8c8d-50e52e250494', 'Graduation Project', 'Graduation Project', 'https://res.cloudinary.com/dax2irx1f/image/upload/v1777042990/posters/wx2zdsabizb7kbdjsmpz.jpg', '3', 'Fall', '2026-05-04 17:41:41', '2026-05-04 17:41:41'),
('cad8f88a-ad32-4d32-818f-de0956f87263', 'COMP 411', 'Geometry', 'https://res.cloudinary.com/dax2irx1f/image/upload/v1772145824/posters/n4c2qysd1oxqkzr4te4v.jpg', '4', 'Fall', '2026-05-04 17:41:36', '2026-05-04 17:41:36'),
('effc1622-8fa3-4756-9e04-3b84d7f6b094', 'COMP 402', 'Bioinformatics', 'https://res.cloudinary.com/dax2irx1f/image/upload/v1772145824/posters/n4c2qysd1oxqkzr4te4v.jpg', '4', 'Spring', '2026-05-04 17:41:31', '2026-05-04 17:41:31');

-- --------------------------------------------------------

--
-- Table structure for table `group_admin`
--

CREATE TABLE `group_admin` (
  `id` varchar(36) NOT NULL,
  `group_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `role` enum('OWNER','ADMIN') NOT NULL DEFAULT 'ADMIN',
  `assigned_by` varchar(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `group_admin`
--

INSERT INTO `group_admin` (`id`, `group_id`, `user_id`, `role`, `assigned_by`, `created_at`, `updated_at`) VALUES
('0f82ac5e-8e0e-4667-aa4b-2d4be11d2e84', '023d04ae-56bc-44a4-91d6-3da6ecafd7ea', '384b5462-110b-4081-bc67-8768e8516ad7', 'OWNER', NULL, '2026-05-04 17:41:39', '2026-05-04 17:41:39'),
('23ed6da9-b992-4262-a463-00065a3fbd0e', '536b8acf-ca0d-4ff3-a63c-8038b6ef08cf', 'fbe68fee-e732-4f4f-8246-84d966fee0c4', 'OWNER', NULL, '2026-05-04 17:41:38', '2026-05-04 17:41:38'),
('255f1b91-316a-484a-80c6-55938db5eade', '6eedbd76-d922-4828-b3dd-2baa9ca82fc4', 'ae5c28ed-63d6-4c95-874f-fd2e0108fa26', 'OWNER', NULL, '2026-05-04 17:41:36', '2026-05-04 17:41:36'),
('4cc07379-e8e8-4576-b12c-b11524b66370', '83748aba-96f8-4688-bc0f-a81c54bedaf2', 'ae5c28ed-63d6-4c95-874f-fd2e0108fa26', 'ADMIN', NULL, '2026-05-04 17:41:34', '2026-05-04 17:41:34'),
('6f4ac67d-2776-47c6-9c43-cc9a9efee591', 'cad8f88a-ad32-4d32-818f-de0956f87263', '72ccdd7d-f991-40c3-850b-35a944f9da41', 'OWNER', NULL, '2026-05-04 17:41:37', '2026-05-04 17:41:37'),
('785678b7-dbfe-4f2c-9ea6-178b70d28454', '06068b96-56e4-42b2-b14d-f0ea5b6daa58', 'e7beeaa2-4c29-4b3c-b99a-0bda253eaf3d', 'OWNER', NULL, '2026-05-04 17:41:35', '2026-05-04 17:41:35'),
('7f56a09a-981a-4ef4-9294-7325169eebb6', 'b6791847-e443-4543-8d51-71863e2929b3', '62007461-76d0-4d66-803c-df77ba651887', 'OWNER', NULL, '2026-05-04 17:41:40', '2026-05-04 17:41:40'),
('a8ff23ad-85c7-4786-afb3-541afa6ad760', '2b029ef9-10e2-433c-bce2-d4de8b922577', '7345e640-af7d-4283-ba5d-b1a2c361ec17', 'OWNER', NULL, '2026-05-04 17:41:38', '2026-05-04 17:41:38'),
('a9fda97f-9063-413d-aa2f-3fac44a6ce83', 'effc1622-8fa3-4756-9e04-3b84d7f6b094', '7345e640-af7d-4283-ba5d-b1a2c361ec17', 'OWNER', NULL, '2026-05-04 17:41:32', '2026-05-04 17:41:32'),
('b19b89ce-16fc-4807-a06f-3b8282917369', 'a6ff89a2-a7ac-4f90-8f8e-2854e2c17bfc', 'fbe68fee-e732-4f4f-8246-84d966fee0c4', 'OWNER', NULL, '2026-05-04 17:41:33', '2026-05-04 17:41:33'),
('b4d7e9cc-063c-4141-882d-e090e0f23499', 'c46c4adb-4934-44a6-8c8d-50e52e250494', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'OWNER', NULL, '2026-05-04 17:41:41', '2026-05-04 17:41:41'),
('bc00c1e7-3596-4429-8a39-ac8ce8647eeb', '83748aba-96f8-4688-bc0f-a81c54bedaf2', '384b5462-110b-4081-bc67-8768e8516ad7', 'OWNER', NULL, '2026-05-04 17:41:34', '2026-05-04 17:41:34'),
('d31b6ef2-13f9-48d0-ab47-b7da55274893', 'ae4bfdaa-2b85-4e71-ba9b-460a9eb7cdf9', 'e7beeaa2-4c29-4b3c-b99a-0bda253eaf3d', 'OWNER', NULL, '2026-05-04 17:41:40', '2026-05-04 17:41:40'),
('ec159cc2-906d-4b02-9b23-47e48007a606', '36f619eb-1250-474f-ad32-8f1dfaed10b0', '384b5462-110b-4081-bc67-8768e8516ad7', 'OWNER', NULL, '2026-05-04 17:41:36', '2026-05-04 17:41:36');

-- --------------------------------------------------------

--
-- Table structure for table `group_content`
--

CREATE TABLE `group_content` (
  `id` varchar(36) NOT NULL,
  `content_name` varchar(255) NOT NULL,
  `content_description` text DEFAULT NULL,
  `group_id` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `group_content`
--

INSERT INTO `group_content` (`id`, `content_name`, `content_description`, `group_id`, `created_at`, `updated_at`) VALUES
('08610a67-1eb1-45e2-8b47-4bb920f8af0d', 'COMP 411 Content', 'Geometry', 'cad8f88a-ad32-4d32-818f-de0956f87263', '2026-05-04 17:41:36', '2026-05-04 17:41:36'),
('1d20a959-a8ac-47f3-8117-260e6f760cfa', 'COMP 404 Content', 'Software Engineering', 'a6ff89a2-a7ac-4f90-8f8e-2854e2c17bfc', '2026-05-04 17:41:32', '2026-05-04 17:41:32'),
('2f3357fd-6e83-4912-bcf7-191de964dc44', 'COMP 416 Content', 'Data Mining', '06068b96-56e4-42b2-b14d-f0ea5b6daa58', '2026-05-04 17:41:34', '2026-05-04 17:41:34'),
('33dec15d-9579-4451-b9e6-b882948dce47', 'COMP309 Content', 'Multimedia', '536b8acf-ca0d-4ff3-a63c-8038b6ef08cf', '2026-05-04 17:41:37', '2026-05-04 17:41:37'),
('362050bb-35c1-4a39-97d3-d96e338e0497', 'COMP305 Content', 'Complexity', '023d04ae-56bc-44a4-91d6-3da6ecafd7ea', '2026-05-04 17:41:39', '2026-05-04 17:41:39'),
('68a4fa61-7e99-4a3c-b619-34931b261c62', 'COMP 402 Content', 'Bioinformatics', 'effc1622-8fa3-4756-9e04-3b84d7f6b094', '2026-05-04 17:41:32', '2026-05-04 17:41:32'),
('97259cc1-4dd4-4fd1-9a90-50b1d209bb5d', 'COMP 401 Content', 'AI', '36f619eb-1250-474f-ad32-8f1dfaed10b0', '2026-05-04 17:41:35', '2026-05-04 17:41:35'),
('a257630d-8c1c-4884-847b-cab96943be49', 'COMP307 Content', 'Operating Systems', '2b029ef9-10e2-433c-bce2-d4de8b922577', '2026-05-04 17:41:38', '2026-05-04 17:41:38'),
('b7341a07-7417-4d69-b1a2-ac3e5f5f102f', 'Graduation Project Content', 'Graduation Project', 'c46c4adb-4934-44a6-8c8d-50e52e250494', '2026-05-04 17:41:41', '2026-05-04 17:41:41'),
('c7327633-a2ff-4e4f-9244-eba9c052f13b', 'COMP 408 Content', 'Advanced AI', '83748aba-96f8-4688-bc0f-a81c54bedaf2', '2026-05-04 17:41:33', '2026-05-04 17:41:33'),
('cfb5d984-3f73-4233-97f4-e301c50abab6', 'COMP301 Content', 'Java Programming', 'b6791847-e443-4543-8d51-71863e2929b3', '2026-05-04 17:41:40', '2026-05-04 17:41:40'),
('d73ca35c-5185-4320-97ba-c4cda2a1d81a', 'COMP303 Content', 'Syntax', 'ae4bfdaa-2b85-4e71-ba9b-460a9eb7cdf9', '2026-05-04 17:41:39', '2026-05-04 17:41:39'),
('e43c31d0-3a24-4f10-a39e-d85ac2ba78fa', 'COMP 403 Content', 'Image Processing', '6eedbd76-d922-4828-b3dd-2baa9ca82fc4', '2026-05-04 17:41:36', '2026-05-04 17:41:36');

-- --------------------------------------------------------

--
-- Table structure for table `group_content_resource`
--

CREATE TABLE `group_content_resource` (
  `id` varchar(36) NOT NULL,
  `group_content_id` varchar(36) NOT NULL,
  `file_url` text NOT NULL,
  `file_name` varchar(255) NOT NULL,
  `file_type` varchar(255) NOT NULL,
  `file_size` bigint(20) DEFAULT NULL,
  `meeting_id` varchar(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `group_membership`
--

CREATE TABLE `group_membership` (
  `id` varchar(36) NOT NULL,
  `group_id` varchar(36) NOT NULL,
  `member_id` varchar(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `group_membership`
--

INSERT INTO `group_membership` (`id`, `group_id`, `member_id`, `created_at`, `updated_at`) VALUES
('21859b70-dcc8-4c22-8d58-213588530a81', 'c46c4adb-4934-44a6-8c8d-50e52e250494', '62d55667-2fd7-4e8c-885e-b86672512e29', '2026-05-04 17:48:37', '2026-05-04 17:48:37'),
('a635f7f6-d7b3-4dd9-b096-2e79154f3351', 'c46c4adb-4934-44a6-8c8d-50e52e250494', '698f27be-f68c-4692-84ba-49ba5fc63769', '2026-05-05 15:30:00', '2026-05-05 15:30:00'),
('ba07c479-d7d5-4970-b736-7b0bab35a524', 'c46c4adb-4934-44a6-8c8d-50e52e250494', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', '2026-05-04 18:37:20', '2026-05-04 18:37:20');

-- --------------------------------------------------------

--
-- Table structure for table `group_message`
--

CREATE TABLE `group_message` (
  `id` varchar(36) NOT NULL,
  `group_id` varchar(36) NOT NULL,
  `sender_id` varchar(36) NOT NULL,
  `message` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `parent_message_id` varchar(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `group_message`
--

INSERT INTO `group_message` (`id`, `group_id`, `sender_id`, `message`, `created_at`, `parent_message_id`) VALUES
('3292c09d-d91a-47a7-ab34-2722e00a85a3', 'c46c4adb-4934-44a6-8c8d-50e52e250494', '698f27be-f68c-4692-84ba-49ba5fc63769', 'hi', '2026-05-05 16:31:52', NULL);

-- --------------------------------------------------------

--
-- Table structure for table `group_message_media`
--

CREATE TABLE `group_message_media` (
  `id` varchar(36) NOT NULL,
  `group_id` varchar(36) NOT NULL,
  `sender_id` varchar(36) NOT NULL,
  `message_id` varchar(36) NOT NULL,
  `media_url` text NOT NULL,
  `media_type` enum('image','voice','file','link') NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `file_name` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `like`
--

CREATE TABLE `like` (
  `id` varchar(36) NOT NULL,
  `member_id` varchar(36) NOT NULL,
  `video_id` varchar(36) NOT NULL,
  `like_type` tinyint(1) NOT NULL COMMENT '0 = dislike, 1 = like',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `meeting`
--

CREATE TABLE `meeting` (
  `id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `start_time` datetime NOT NULL,
  `end_time` datetime NOT NULL,
  `status` enum('Scheduled','Completed','Cancelled') NOT NULL,
  `group_id` varchar(36) NOT NULL,
  `description` text DEFAULT NULL,
  `poster_url` text NOT NULL,
  `recording` tinyint(1) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `is_weekly` tinyint(1) DEFAULT NULL,
  `series_id` varchar(36) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `meeting`
--

INSERT INTO `meeting` (`id`, `title`, `start_time`, `end_time`, `status`, `group_id`, `description`, `poster_url`, `recording`, `created_at`, `updated_at`, `is_weekly`, `series_id`) VALUES
('57368ad4-adc1-4706-946e-db1c4dd5073b', 'test', '2026-05-05 13:34:00', '2026-05-05 16:32:00', 'Scheduled', 'c46c4adb-4934-44a6-8c8d-50e52e250494', NULL, 'https://res.cloudinary.com/dax2irx1f/image/upload/v1777977196/posters/uxb0kg8vdj1jznxhgxyo.png', 0, '2026-05-05 10:33:17', '2026-05-05 10:33:17', 0, NULL),
('eed4b647-47d8-444d-a826-ad6c38081303', 'Graduation meeting', '2026-05-05 18:01:00', '2026-05-05 22:00:00', 'Scheduled', 'c46c4adb-4934-44a6-8c8d-50e52e250494', '', 'https://res.cloudinary.com/dax2irx1f/image/upload/v1777920713/posters/botvltfk4iiyawtpqvak.png', 0, '2026-05-04 17:45:38', '2026-05-05 15:00:25', 0, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `meeting_admin`
--

CREATE TABLE `meeting_admin` (
  `id` varchar(36) NOT NULL,
  `meeting_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `role` enum('OWNER','ADMIN') NOT NULL DEFAULT 'ADMIN',
  `assigned_by` varchar(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `meeting_admin`
--

INSERT INTO `meeting_admin` (`id`, `meeting_id`, `user_id`, `role`, `assigned_by`, `created_at`, `updated_at`) VALUES
('712d90c6-3b3a-4d61-818e-41a9879778ce', 'eed4b647-47d8-444d-a826-ad6c38081303', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'OWNER', '4d6ccad9-940b-4de2-9dec-569a6edffa28', '2026-05-04 17:45:38', '2026-05-04 17:45:38'),
('84f62de3-3cd2-444e-9718-5d8d51ddfccd', '57368ad4-adc1-4706-946e-db1c4dd5073b', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'OWNER', '4d6ccad9-940b-4de2-9dec-569a6edffa28', '2026-05-05 10:33:18', '2026-05-05 10:33:18');

-- --------------------------------------------------------

--
-- Table structure for table `meeting_participant`
--

CREATE TABLE `meeting_participant` (
  `id` varchar(36) NOT NULL,
  `meeting_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `joined_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `meeting_participant`
--

INSERT INTO `meeting_participant` (`id`, `meeting_id`, `user_id`, `joined_at`) VALUES
('7572044e-d238-49d5-9118-48af71a7b226', '57368ad4-adc1-4706-946e-db1c4dd5073b', '4d6ccad9-940b-4de2-9dec-569a6edffa28', '2026-05-05 11:01:30'),
('872be539-e45e-4f2f-9d67-7d301f8edadc', '57368ad4-adc1-4706-946e-db1c4dd5073b', '62d55667-2fd7-4e8c-885e-b86672512e29', '2026-05-05 11:01:45');

-- --------------------------------------------------------

--
-- Table structure for table `meeting_series`
--

CREATE TABLE `meeting_series` (
  `id` varchar(36) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `group_id` varchar(36) NOT NULL,
  `original_meeting_id` varchar(36) DEFAULT NULL,
  `template_title` varchar(255) NOT NULL,
  `template_poster_url` text DEFAULT NULL,
  `template_description` text DEFAULT NULL,
  `template_recording` tinyint(1) NOT NULL DEFAULT 0,
  `duration_ms` int(10) UNSIGNED NOT NULL,
  `day_of_week` tinyint(4) NOT NULL COMMENT '0=Sunday .. 6=Saturday (node-schedule)',
  `start_hour` tinyint(3) UNSIGNED NOT NULL,
  `start_minute` tinyint(3) UNSIGNED NOT NULL,
  `start_second` tinyint(3) UNSIGNED NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `member`
--

CREATE TABLE `member` (
  `user_id` varchar(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `member`
--

INSERT INTO `member` (`user_id`, `created_at`, `updated_at`) VALUES
('1c197e49-aaf2-4f46-80a7-142753a98d97', '2026-05-03 16:33:40', '2026-05-03 16:33:40'),
('35917b43-1e2b-40cd-bfa7-59de18e0330d', '2025-12-02 19:03:53', '2025-12-02 19:03:53'),
('5c62761f-f2d5-4f1c-9af5-bc2e466f0de9', '2026-04-30 18:54:09', '2026-04-30 18:54:09'),
('62d55667-2fd7-4e8c-885e-b86672512e29', '2025-12-02 17:11:58', '2025-12-02 17:11:58'),
('698f27be-f68c-4692-84ba-49ba5fc63769', '2026-01-06 11:53:20', '2026-01-06 11:53:20'),
('894b797d-b322-420e-b1bb-651d85df42e0', '2026-05-06 13:06:14', '2026-05-06 13:06:14'),
('8cb755a1-8101-4df0-a9c0-b03686bbc3cf', '2026-04-30 18:03:56', '2026-04-30 18:03:56'),
('e9f445e2-18da-4a82-8f37-24943900bb00', '2026-02-15 20:39:28', '2026-02-15 20:39:28'),
('fd0ab158-667b-499a-b74d-267a5e102a34', '2026-03-17 14:14:42', '2026-03-17 14:14:42');

-- --------------------------------------------------------

--
-- Table structure for table `message_reaction`
--

CREATE TABLE `message_reaction` (
  `id` varchar(36) NOT NULL,
  `message_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `emoji` varchar(20) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `message_reaction`
--

-- --------------------------------------------------------

--
-- Table structure for table `message_read_status`
--

CREATE TABLE `message_read_status` (
  `id` varchar(36) NOT NULL,
  `message_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `is_read` tinyint(1) DEFAULT 0 COMMENT '0 = unread, 1 = read',
  `read_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `message_read_status`
--

INSERT INTO `message_read_status` (`id`, `message_id`, `user_id`, `is_read`, `read_at`, `created_at`, `updated_at`) VALUES
('0ae3f979-96b2-4978-a4b8-46babd0d33be', 'b4df0492-3e6e-4611-8cae-d68d4e1bcbe7', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', 1, '2026-05-03 21:40:55', '2026-05-03 20:40:56', '2026-05-03 20:40:56'),
('0d508b48-2e5f-4ceb-a1ad-b491fccae4ab', '2cf82f9d-36a9-413e-b870-25234e2cae51', '698f27be-f68c-4692-84ba-49ba5fc63769', 1, '2026-05-03 19:29:43', '2026-05-03 18:29:31', '2026-05-03 18:29:44'),
('0dde4829-bc65-4404-aaee-8f4af82e5fce', '3292c09d-d91a-47a7-ab34-2722e00a85a3', '62d55667-2fd7-4e8c-885e-b86672512e29', 0, NULL, '2026-05-05 15:31:53', '2026-05-05 15:31:53'),
('126de44b-63e1-4210-9018-1832f78af111', '5d09af8f-2c42-4199-b197-73f506ad1ad8', '1c197e49-aaf2-4f46-80a7-142753a98d97', 1, '2026-05-03 19:18:57', '2026-05-03 18:18:58', '2026-05-03 18:18:58'),
('12c9d172-555b-4acc-980c-4f010a603538', '5d09af8f-2c42-4199-b197-73f506ad1ad8', '698f27be-f68c-4692-84ba-49ba5fc63769', 1, '2026-05-03 18:13:42', '2026-05-03 17:13:43', '2026-05-03 17:13:43'),
('17ccaace-816c-403b-8206-645e64e627f0', '3292c09d-d91a-47a7-ab34-2722e00a85a3', '698f27be-f68c-4692-84ba-49ba5fc63769', 1, '2026-05-05 16:31:52', '2026-05-05 15:31:53', '2026-05-05 15:31:53'),
('18434947-4045-4364-824b-5284935477be', 'b4df0492-3e6e-4611-8cae-d68d4e1bcbe7', '35917b43-1e2b-40cd-bfa7-59de18e0330d', 1, '2026-05-04 16:36:45', '2026-05-03 19:07:47', '2026-05-04 15:36:47'),
('19511e34-fe14-4cf7-a918-3c83303b310b', '0d40c6a7-0418-47e3-adf4-acb735f114b7', '698f27be-f68c-4692-84ba-49ba5fc63769', 1, '2026-05-03 18:13:53', '2026-05-03 17:13:54', '2026-05-03 17:13:54'),
('1d9a5df7-32c8-4967-ac9c-a9460986d841', '06b42250-8d53-44ba-a14c-62e3c0d52bdf', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 1, '2026-05-03 19:22:32', '2026-05-03 18:22:33', '2026-05-03 18:22:33'),
('1eba3c36-4c46-4d1b-968b-8a6fd823634d', '3292c09d-d91a-47a7-ab34-2722e00a85a3', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', 1, '2026-05-05 16:34:57', '2026-05-05 15:31:53', '2026-05-05 15:34:58'),
('212f5add-2c61-43ac-a781-0f22ba9c2ce6', 'c6780778-ed99-49a6-a5a4-a78cfffa594a', '698f27be-f68c-4692-84ba-49ba5fc63769', 1, '2026-05-03 20:07:28', '2026-05-03 19:07:29', '2026-05-03 19:07:29'),
('2931c8b7-e993-4070-b041-5f3b4d04a8ab', 'c6780778-ed99-49a6-a5a4-a78cfffa594a', '62d55667-2fd7-4e8c-885e-b86672512e29', 1, '2026-05-03 20:07:35', '2026-05-03 19:07:29', '2026-05-03 19:07:36'),
('29629b8a-e9fc-4863-a6df-06aa984afa7f', 'e1235abf-d91d-477b-98a6-c9c7bfebd92d', '1c197e49-aaf2-4f46-80a7-142753a98d97', 1, '2026-05-03 19:29:59', '2026-05-03 18:22:49', '2026-05-03 18:30:01'),
('2db91041-544c-40c4-b09f-0ff908bbfe5a', '0d40c6a7-0418-47e3-adf4-acb735f114b7', '1c197e49-aaf2-4f46-80a7-142753a98d97', 1, '2026-05-03 19:18:57', '2026-05-03 18:18:58', '2026-05-03 18:18:58'),
('30e68a7e-d33d-4c45-9928-ac23d8c20051', '5d09af8f-2c42-4199-b197-73f506ad1ad8', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', 1, '2026-05-03 21:40:54', '2026-05-03 20:40:54', '2026-05-03 20:40:54'),
('319faf4a-f943-4c77-9776-629a1aa20ea3', '0d40c6a7-0418-47e3-adf4-acb735f114b7', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 1, '2026-05-03 19:22:05', '2026-05-03 17:13:54', '2026-05-03 18:22:06'),
('35d04ed5-8543-4ec7-b21e-7433ef1c6b8b', '2cf82f9d-36a9-413e-b870-25234e2cae51', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', 1, '2026-05-03 21:40:55', '2026-05-03 20:40:56', '2026-05-03 20:40:56'),
('36b87a3f-fbd4-4009-9eb8-34932083a052', '16544d41-bab7-4c01-961a-78496ffc8dc3', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 1, '2026-05-03 19:22:05', '2026-05-03 17:14:50', '2026-05-03 18:22:06'),
('3a195141-40dc-4b25-bac0-a4574a77171f', '4e187dba-586f-4f0b-b10e-7cf3acc7290e', '35917b43-1e2b-40cd-bfa7-59de18e0330d', 1, '2026-05-03 19:22:23', '2026-05-03 18:22:21', '2026-05-03 18:22:24'),
('3d30882c-3cef-49af-9ddb-f764cad5c535', '2cf82f9d-36a9-413e-b870-25234e2cae51', '35917b43-1e2b-40cd-bfa7-59de18e0330d', 1, '2026-05-03 19:33:12', '2026-05-03 18:29:31', '2026-05-03 18:33:13'),
('3f57c72e-9134-4b2d-b5a7-f908f45dcbaa', '06b42250-8d53-44ba-a14c-62e3c0d52bdf', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', 1, '2026-05-03 21:40:55', '2026-05-03 20:40:55', '2026-05-03 20:40:55'),
('418432e8-db74-403b-a2e0-e7f532649940', '0d40c6a7-0418-47e3-adf4-acb735f114b7', '35917b43-1e2b-40cd-bfa7-59de18e0330d', 1, '2026-05-03 19:22:22', '2026-05-03 18:22:23', '2026-05-03 18:22:23'),
('43e15c17-7558-44ce-83e3-34559afd3d63', '0d40c6a7-0418-47e3-adf4-acb735f114b7', '62d55667-2fd7-4e8c-885e-b86672512e29', 1, '2026-05-03 18:14:13', '2026-05-03 17:13:54', '2026-05-03 17:14:14'),
('44bf962f-b6ea-4f91-bc25-40d4a2c060a9', '5d09af8f-2c42-4199-b197-73f506ad1ad8', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 1, '2026-05-03 19:22:04', '2026-05-03 17:11:39', '2026-05-03 18:22:06'),
('49999f09-5c27-42e2-95eb-459325b892e3', '4e187dba-586f-4f0b-b10e-7cf3acc7290e', '62d55667-2fd7-4e8c-885e-b86672512e29', 1, '2026-05-03 19:30:24', '2026-05-03 18:22:21', '2026-05-03 18:30:26'),
('4a256ef3-3afb-472b-bdb3-5d6491c1ef11', 'e1235abf-d91d-477b-98a6-c9c7bfebd92d', '62d55667-2fd7-4e8c-885e-b86672512e29', 1, '2026-05-03 19:30:25', '2026-05-03 18:22:49', '2026-05-03 18:30:26'),
('4f169305-7a78-4d4d-931b-c349811e188e', '16544d41-bab7-4c01-961a-78496ffc8dc3', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', 1, '2026-05-03 21:40:54', '2026-05-03 20:40:55', '2026-05-03 20:40:55'),
('51ecd665-775a-4d92-8572-620c0126af48', '4e187dba-586f-4f0b-b10e-7cf3acc7290e', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 1, '2026-05-03 19:22:20', '2026-05-03 18:22:21', '2026-05-03 18:22:21'),
('5e5e8370-6947-453c-87e1-491e07ea59ae', 'b4df0492-3e6e-4611-8cae-d68d4e1bcbe7', '698f27be-f68c-4692-84ba-49ba5fc63769', 1, '2026-05-04 11:54:16', '2026-05-03 19:07:47', '2026-05-04 10:54:17'),
('5f52c597-825c-43c9-ae10-9b184988ac2e', '16544d41-bab7-4c01-961a-78496ffc8dc3', '1c197e49-aaf2-4f46-80a7-142753a98d97', 1, '2026-05-03 19:18:57', '2026-05-03 18:18:58', '2026-05-03 18:18:58'),
('62a3fcd9-805d-402d-84f0-5770cc4ea142', 'e1235abf-d91d-477b-98a6-c9c7bfebd92d', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 1, '2026-05-03 19:22:48', '2026-05-03 18:22:49', '2026-05-03 18:22:49'),
('64234d3c-2a0b-4f1f-9df6-18b2bcbdd995', '06b42250-8d53-44ba-a14c-62e3c0d52bdf', '35917b43-1e2b-40cd-bfa7-59de18e0330d', 1, '2026-05-03 19:22:33', '2026-05-03 18:22:33', '2026-05-03 18:22:34'),
('66f4a1f2-d8f2-4127-80db-ad5719867ca7', '16544d41-bab7-4c01-961a-78496ffc8dc3', '62d55667-2fd7-4e8c-885e-b86672512e29', 1, '2026-05-03 18:14:49', '2026-05-03 17:14:50', '2026-05-03 17:14:50'),
('6805cea0-e096-41c3-8d4d-c1433abdd0e0', '4e187dba-586f-4f0b-b10e-7cf3acc7290e', '1c197e49-aaf2-4f46-80a7-142753a98d97', 1, '2026-05-03 19:29:59', '2026-05-03 18:22:21', '2026-05-03 18:30:00'),
('6901e89f-8647-4398-b9c2-5276c5ca718a', '2cf82f9d-36a9-413e-b870-25234e2cae51', '62d55667-2fd7-4e8c-885e-b86672512e29', 1, '2026-05-03 19:30:25', '2026-05-03 18:29:31', '2026-05-03 18:30:26'),
('6a09df81-f98c-4bfb-9402-b388b82c2dad', '16544d41-bab7-4c01-961a-78496ffc8dc3', '698f27be-f68c-4692-84ba-49ba5fc63769', 1, '2026-05-03 18:14:51', '2026-05-03 17:14:50', '2026-05-03 17:14:52'),
('6cd84074-2c9c-4eba-ab93-4a4b4c64d1ab', '5d09af8f-2c42-4199-b197-73f506ad1ad8', '35917b43-1e2b-40cd-bfa7-59de18e0330d', 1, '2026-05-03 19:22:22', '2026-05-03 18:22:23', '2026-05-03 18:22:23'),
('733b55de-4f59-43bf-b6f8-4e833fa6ee77', '0d40c6a7-0418-47e3-adf4-acb735f114b7', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', 1, '2026-05-03 21:40:54', '2026-05-03 20:40:55', '2026-05-03 20:40:55'),
('73c817d3-0487-4799-95a3-6fcac6010e44', '2cf82f9d-36a9-413e-b870-25234e2cae51', '1c197e49-aaf2-4f46-80a7-142753a98d97', 1, '2026-05-03 19:30:00', '2026-05-03 18:29:31', '2026-05-03 18:30:01'),
('76c0de63-0468-4e50-b4d4-3c2864200aba', 'e1235abf-d91d-477b-98a6-c9c7bfebd92d', '35917b43-1e2b-40cd-bfa7-59de18e0330d', 1, '2026-05-03 19:23:02', '2026-05-03 18:22:49', '2026-05-03 18:23:03'),
('7ff34ebc-207e-4ca6-aca1-33c3895322be', 'eb1043ad-bb46-4caf-a488-5c6bf2c76628', '35917b43-1e2b-40cd-bfa7-59de18e0330d', 1, '2026-05-03 19:22:26', '2026-05-03 18:22:26', '2026-05-03 18:22:28'),
('834be0ca-ff25-45fb-95e6-49fbf0303fe7', '16544d41-bab7-4c01-961a-78496ffc8dc3', '35917b43-1e2b-40cd-bfa7-59de18e0330d', 1, '2026-05-03 19:22:22', '2026-05-03 18:22:24', '2026-05-03 18:22:24'),
('8ce621ee-2206-41c6-98f0-bac035a83c36', '06b42250-8d53-44ba-a14c-62e3c0d52bdf', '1c197e49-aaf2-4f46-80a7-142753a98d97', 1, '2026-05-03 19:29:59', '2026-05-03 18:22:33', '2026-05-03 18:30:00'),
('a5167842-be72-4735-9c19-5f4762322423', '2cf82f9d-36a9-413e-b870-25234e2cae51', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 1, '2026-05-03 19:29:30', '2026-05-03 18:29:31', '2026-05-03 18:29:31'),
('a8ae6c65-dec9-4629-8b28-edac443b5ab6', 'b4df0492-3e6e-4611-8cae-d68d4e1bcbe7', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 1, '2026-05-03 21:19:12', '2026-05-03 19:07:47', '2026-05-03 20:19:12'),
('a90dc59b-7d15-4b42-aa93-370a3bb88bb4', '3292c09d-d91a-47a7-ab34-2722e00a85a3', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 1, '2026-05-05 16:59:06', '2026-05-05 15:31:53', '2026-05-05 15:59:06'),
('af3ad526-f671-42ac-ada0-a2a332e3b7b0', '4e187dba-586f-4f0b-b10e-7cf3acc7290e', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', 1, '2026-05-03 21:40:55', '2026-05-03 20:40:55', '2026-05-03 20:40:55'),
('af64641d-8771-4c2f-ae4d-38841a2771ca', 'b4df0492-3e6e-4611-8cae-d68d4e1bcbe7', '1c197e49-aaf2-4f46-80a7-142753a98d97', 1, '2026-05-04 12:31:31', '2026-05-03 19:07:47', '2026-05-04 11:31:32'),
('b04f0803-7ed4-410b-bed3-194a1587b432', '4e187dba-586f-4f0b-b10e-7cf3acc7290e', '698f27be-f68c-4692-84ba-49ba5fc63769', 1, '2026-05-03 19:29:43', '2026-05-03 18:22:21', '2026-05-03 18:29:44'),
('bb31a283-2f09-4a50-9e5d-293c2122bdab', '06b42250-8d53-44ba-a14c-62e3c0d52bdf', '62d55667-2fd7-4e8c-885e-b86672512e29', 1, '2026-05-03 19:30:25', '2026-05-03 18:22:33', '2026-05-03 18:30:26'),
('bd85bfdf-e963-435b-80b0-d15a9cb28c7e', 'b4df0492-3e6e-4611-8cae-d68d4e1bcbe7', '62d55667-2fd7-4e8c-885e-b86672512e29', 1, '2026-05-03 20:07:46', '2026-05-03 19:07:47', '2026-05-03 19:07:47'),
('bfdbee34-cac1-4144-810a-59d083a5acbc', 'e1235abf-d91d-477b-98a6-c9c7bfebd92d', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', 1, '2026-05-03 21:40:55', '2026-05-03 20:40:55', '2026-05-03 20:40:55'),
('c0a9ca69-d80f-47e0-b6d4-1aba1cf08f95', 'c6780778-ed99-49a6-a5a4-a78cfffa594a', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', 1, '2026-05-03 21:40:55', '2026-05-03 20:40:56', '2026-05-03 20:40:56'),
('c784fa02-2f29-4275-80aa-c73c6a1cdc94', 'eb1043ad-bb46-4caf-a488-5c6bf2c76628', '698f27be-f68c-4692-84ba-49ba5fc63769', 1, '2026-05-03 19:29:43', '2026-05-03 18:22:26', '2026-05-03 18:29:44'),
('c8b5acf2-be4d-4a47-9545-7a3274b2ba1c', 'c6780778-ed99-49a6-a5a4-a78cfffa594a', '1c197e49-aaf2-4f46-80a7-142753a98d97', 1, '2026-05-04 12:31:31', '2026-05-03 19:07:29', '2026-05-04 11:31:32'),
('d8d97533-756c-4421-a504-7097a00838b0', 'eb1043ad-bb46-4caf-a488-5c6bf2c76628', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 1, '2026-05-03 19:22:25', '2026-05-03 18:22:26', '2026-05-03 18:22:26'),
('d8e74b5e-6ce9-4414-a584-27e023cf85bc', 'e1235abf-d91d-477b-98a6-c9c7bfebd92d', '698f27be-f68c-4692-84ba-49ba5fc63769', 1, '2026-05-03 19:29:43', '2026-05-03 18:22:49', '2026-05-03 18:29:44'),
('d91e5ebf-ea59-4332-a06b-def9c6704213', '06b42250-8d53-44ba-a14c-62e3c0d52bdf', '698f27be-f68c-4692-84ba-49ba5fc63769', 1, '2026-05-03 19:29:43', '2026-05-03 18:22:33', '2026-05-03 18:29:44'),
('dfdb8e7f-d05d-4991-886d-2cf935cb9612', '5d09af8f-2c42-4199-b197-73f506ad1ad8', '62d55667-2fd7-4e8c-885e-b86672512e29', 1, '2026-05-03 18:11:39', '2026-05-03 17:11:39', '2026-05-03 17:11:39'),
('e762df4d-6eba-424e-8a04-e6c5802566e1', 'c6780778-ed99-49a6-a5a4-a78cfffa594a', '35917b43-1e2b-40cd-bfa7-59de18e0330d', 1, '2026-05-04 16:36:45', '2026-05-03 19:07:29', '2026-05-04 15:36:46'),
('e804fd56-3530-4c52-a797-39a236d9a1f4', 'c6780778-ed99-49a6-a5a4-a78cfffa594a', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 1, '2026-05-03 21:19:11', '2026-05-03 19:07:29', '2026-05-03 20:19:12'),
('f690933d-e62d-4a03-a6bb-eab67f67fe6f', 'eb1043ad-bb46-4caf-a488-5c6bf2c76628', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', 1, '2026-05-03 21:40:55', '2026-05-03 20:40:55', '2026-05-03 20:40:55'),
('f8fd7f85-6c11-4b0c-a42d-fd1bc2350697', 'eb1043ad-bb46-4caf-a488-5c6bf2c76628', '1c197e49-aaf2-4f46-80a7-142753a98d97', 1, '2026-05-03 19:29:59', '2026-05-03 18:22:26', '2026-05-03 18:30:00'),
('fd08419e-6d52-456c-bbe2-29f36bd37b0c', 'eb1043ad-bb46-4caf-a488-5c6bf2c76628', '62d55667-2fd7-4e8c-885e-b86672512e29', 1, '2026-05-03 19:30:25', '2026-05-03 18:22:26', '2026-05-03 18:30:26');

-- --------------------------------------------------------

--
-- Table structure for table `notifications`
--

CREATE TABLE `notifications` (
  `id` varchar(36) NOT NULL,
  `member_id` varchar(36) NOT NULL,
  `sender_id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `is_read` tinyint(1) DEFAULT 0,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notifications`
--

INSERT INTO `notifications` (`id`, `member_id`, `sender_id`, `title`, `message`, `is_read`, `created_at`) VALUES
('01e88d6c-e701-4045-b2eb-75da73c93cba', '4d6ccad9-940b-4de2-9dec-569a6edffa28', '9a5becdf-22bd-47de-85c9-f0e66063e379', 'Group approved', 'Your group \"Comp Test\" was approved by Aya Mo Helal.', 1, '2026-05-03 17:07:38'),
('03656058-255d-47c4-91c6-fa4ddd243073', '698f27be-f68c-4692-84ba-49ba5fc63769', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-03 13:25:00 to 2026-05-04 04:26:00.', 1, '2026-05-03 22:20:52'),
('0458f2bb-13c4-4781-b868-6978db1df5c2', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"Graduation meeting\" has been updated. New schedule: 2026-05-04 20:47:00 to 2026-05-04 23:50:00.', 0, '2026-05-04 18:51:38'),
('058a1980-4c4b-4032-8a28-eaf7aad850fa', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-03 23:46:00 to 2026-05-04 00:26:00.', 1, '2026-05-03 20:45:27'),
('074714b0-55c3-4673-a607-250cb0a266d0', '1c197e49-aaf2-4f46-80a7-142753a98d97', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 21:02:00.', 0, '2026-05-04 17:16:39'),
('07d4811c-2208-41c1-9619-c0fbf61edba2', '698f27be-f68c-4692-84ba-49ba5fc63769', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-03 23:46:00 to 2026-05-04 00:26:00.', 1, '2026-05-03 20:45:27'),
('08c18883-3ae3-4fdb-9630-4bb0182d7649', '35917b43-1e2b-40cd-bfa7-59de18e0330d', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-03 23:46:00 to 2026-05-04 00:26:00.', 1, '2026-05-03 20:45:27'),
('0914b85c-141f-4473-87cf-24383d417103', '35917b43-1e2b-40cd-bfa7-59de18e0330d', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 20:56:00.', 0, '2026-05-04 16:57:46'),
('098369fc-cf2c-47f9-868e-d73523e4b668', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"Graduation meeting\" has been updated. New schedule: 2026-05-04 20:47:00 to 2026-05-04 23:50:00.', 1, '2026-05-04 18:51:38'),
('0bb70c03-e049-4f47-bb4c-89e963a5cbd9', '698f27be-f68c-4692-84ba-49ba5fc63769', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 13:27:00 to 2026-05-04 14:28:00.', 1, '2026-05-04 10:26:43'),
('0c77b0ea-df2a-49be-bd7c-e16784a8411d', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-03 13:17:00 to 2026-05-04 04:26:00.', 1, '2026-05-03 22:14:59'),
('0c81444d-a123-4fea-9638-a3c65b1c3f7f', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"Graduation meeting\" has been updated. New schedule: 2026-05-03 20:47:00 to 2026-05-05 21:00:00.', 0, '2026-05-05 10:32:26'),
('0d1b84f8-a9b3-4c7b-8f57-9fc485765595', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 13:27:00 to 2026-05-04 16:28:00.', 1, '2026-05-04 10:31:19'),
('0d42da75-f1ed-40c0-b5ce-5f6877bb4825', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'New meeting scheduled', 'A new meeting \"test\" is scheduled from 2026-05-04 13:12:00 to 2026-05-04 14:14:00.', 1, '2026-05-04 10:11:52'),
('0d9dba70-ee6d-441f-9952-b2b249a7f0a4', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"Graduation meeting\" has been updated. New schedule: 2026-05-05 18:01:00 to 2026-05-05 22:00:00.', 1, '2026-05-05 15:00:25'),
('0fa60b6e-3cfe-4999-a9a7-432dbce58f5a', 'cae09d05-7a25-4714-bd33-2410319f9cc3', 'fd0ab158-667b-499a-b74d-267a5e102a34', 'New group pending approval', 'A new group \"test\" is waiting for your approval.', 0, '2026-05-03 17:34:40'),
('103428ce-1dd4-40f4-90fc-36c5b06f0210', '0264a84d-d735-4e4a-967b-ba67eed05c58', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'New group pending approval', 'A new group \"Comp Test\" is waiting for your approval.', 1, '2026-05-03 17:07:07'),
('109e2bc8-81cb-4879-b925-ce885537448c', '35917b43-1e2b-40cd-bfa7-59de18e0330d', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 13:27:00 to 2026-05-04 14:28:00.', 1, '2026-05-04 10:26:43'),
('10eef40a-bba7-4612-984a-74fae2857c13', '35917b43-1e2b-40cd-bfa7-59de18e0330d', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting deleted', 'The meeting \"test\" scheduled for Mon May 04 2026 13:06:00 GMT+0300 (Eastern European Summer Time) has been deleted.', 1, '2026-05-04 10:06:24'),
('113d74ab-61f2-4078-89b4-c9af971966f3', '35917b43-1e2b-40cd-bfa7-59de18e0330d', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 21:05:00.', 0, '2026-05-04 17:15:12'),
('127137d7-8bf3-4d04-aff6-1111ce24d26d', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 20:58:00.', 1, '2026-05-04 17:06:38'),
('13603c73-31fb-40e7-9612-2e2859b7361e', '1c197e49-aaf2-4f46-80a7-142753a98d97', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 21:05:00.', 0, '2026-05-04 17:19:48'),
('139fa77f-9b36-4eab-8a0e-4660caa613ae', '1c197e49-aaf2-4f46-80a7-142753a98d97', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-03 13:25:00 to 2026-05-04 04:26:00.', 1, '2026-05-03 22:20:52'),
('14c1d7b0-7e8b-4c4b-8550-bfb294d11f14', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 20:00:00.', 1, '2026-05-04 16:59:16'),
('1629a490-2f84-4f2c-ae0e-d2efd5cf9e91', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 13:27:00 to 2026-05-04 13:28:00.', 1, '2026-05-04 10:27:28'),
('16b26b6c-674c-4dfb-acf3-c48ae39d8af8', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"Graduation meeting\" has been updated. New schedule: 2026-05-03 21:18:00 to 2026-05-03 23:12:00.', 1, '2026-05-03 18:16:27'),
('1722208d-9df0-432d-b976-ba23df9c1eb0', '698f27be-f68c-4692-84ba-49ba5fc63769', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 23:00:00.', 1, '2026-05-04 17:13:30'),
('1ae9787f-084e-4ec4-81ca-0fd806926c2a', '35917b43-1e2b-40cd-bfa7-59de18e0330d', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'New meeting scheduled', 'A new meeting \"test\" is scheduled from 2026-05-04 13:22:00 to 2026-05-04 14:22:00.', 1, '2026-05-04 10:21:50'),
('1b2aab78-578f-45f5-b807-4b2d6d092c35', '698f27be-f68c-4692-84ba-49ba5fc63769', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-03 13:17:00 to 2026-05-04 04:26:00.', 1, '2026-05-03 22:14:59'),
('1b7307ef-1101-4ab8-a4b1-2df0fc39b73a', '698f27be-f68c-4692-84ba-49ba5fc63769', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 13:06:00 to 2026-05-04 14:26:00.', 1, '2026-05-04 10:05:08'),
('1bab737c-c752-495a-ad53-072e0f9a46bd', '0264a84d-d735-4e4a-967b-ba67eed05c58', 'fd0ab158-667b-499a-b74d-267a5e102a34', 'New group pending approval', 'A new group \"test\" is waiting for your approval.', 1, '2026-05-03 17:34:44'),
('1da74a5b-5b96-449a-9497-5d54654c3a07', '1c197e49-aaf2-4f46-80a7-142753a98d97', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 13:09:00 to 2026-05-04 14:26:00.', 1, '2026-05-04 10:03:56'),
('212bbae3-82e1-4fbf-a128-c5c977dd63f2', '9a5becdf-22bd-47de-85c9-f0e66063e379', 'fd0ab158-667b-499a-b74d-267a5e102a34', 'New group pending approval', 'A new group \"test\" is waiting for your approval.', 0, '2026-05-03 17:34:40'),
('22015e9d-c015-4afb-9133-d8670f6ec082', '698f27be-f68c-4692-84ba-49ba5fc63769', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-03 23:45:00 to 2026-05-04 00:26:00.', 1, '2026-05-03 20:44:44'),
('222579b0-69e9-47b0-83c8-a96afa9241cc', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'New meeting scheduled', 'A new meeting \"test\" is scheduled from 2026-05-04 13:14:00 to 2026-05-04 14:16:00.', 1, '2026-05-04 10:13:03'),
('22b27a55-e5bc-4aca-a5f1-c1e516dd2e35', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-03 14:22:00 to 2026-05-04 04:26:00.', 1, '2026-05-03 22:19:12'),
('24f3e4bc-c291-46b7-bf58-9fb2823d2f8c', '1c197e49-aaf2-4f46-80a7-142753a98d97', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 13:06:00 to 2026-05-04 14:26:00.', 1, '2026-05-04 10:05:08'),
('25663011-e71c-4c9d-8911-7515b67db11d', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'New meeting scheduled', 'A new meeting \"Graduation meeting\" is scheduled from 2026-05-03 21:30:00 to 2026-05-03 23:12:00.', 1, '2026-05-03 18:14:04'),
('264f5fbd-ff51-41c9-98c9-24a9684e70eb', '698f27be-f68c-4692-84ba-49ba5fc63769', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Graduation Project Content has been updated in Graduation Project', 'The content \"Graduation Project Content\" has been updated in your group \"Graduation Project\".', 1, '2026-05-05 15:34:42'),
('26692d64-b752-45e3-8c8a-0b4119a4097b', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 20:56:00.', 1, '2026-05-04 16:57:46'),
('26be3deb-2fe4-41a1-9a85-53d045f782f4', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"Graduation meeting\" has been updated. New schedule: 2026-05-05 20:47:00 to 2026-05-05 22:00:00.', 0, '2026-05-05 14:59:26'),
('276cc744-323d-45e0-9e2a-4f5929039aa0', '35917b43-1e2b-40cd-bfa7-59de18e0330d', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-03 13:19:00 to 2026-05-04 04:26:00.', 1, '2026-05-03 22:17:44'),
('2854e0a2-e751-40cc-b1ff-fb067f9fff5d', '0264a84d-d735-4e4a-967b-ba67eed05c58', 'fd0ab158-667b-499a-b74d-267a5e102a34', 'New group pending approval', 'A new group \"test\" is waiting for your approval.', 1, '2026-05-03 17:34:49'),
('2876fc9e-1c98-40ea-b8c5-7174d8a5187b', '9a5becdf-22bd-47de-85c9-f0e66063e379', 'fd0ab158-667b-499a-b74d-267a5e102a34', 'New group pending approval', 'A new group \"test\" is waiting for your approval.', 0, '2026-05-03 17:34:44'),
('28b25b11-1443-4774-84d9-eb6c876ad258', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"Graduation meeting\" has been updated. New schedule: 2026-05-04 20:47:00 to 2026-05-04 23:50:00.', 0, '2026-05-04 18:51:54'),
('29c4fba3-1adf-455e-b968-d146b065c797', '698f27be-f68c-4692-84ba-49ba5fc63769', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 21:02:00.', 1, '2026-05-04 17:16:39'),
('2a224e7a-4286-42e5-ad1b-57a731dd9003', 'cae09d05-7a25-4714-bd33-2410319f9cc3', 'fd0ab158-667b-499a-b74d-267a5e102a34', 'New group pending approval', 'A new group \"test\" is waiting for your approval.', 0, '2026-05-03 17:34:49'),
('2a483ef4-dbc7-4878-bbdc-ee3320191ce8', '698f27be-f68c-4692-84ba-49ba5fc63769', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-03 13:22:00 to 2026-05-04 04:26:00.', 1, '2026-05-03 22:19:37'),
('2af36470-616e-416a-a6aa-3c9aeb9571e2', '35917b43-1e2b-40cd-bfa7-59de18e0330d', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting deleted', 'The meeting \"test\" scheduled for Mon May 04 2026 13:14:00 GMT+0300 (Eastern European Summer Time) has been deleted.', 1, '2026-05-04 10:14:12'),
('2d1f38aa-f063-4d68-bcb9-7e2bb3072b35', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"Graduation meeting\" has been updated. New schedule: 2026-05-03 20:47:00 to 2026-05-03 21:00:00.', 0, '2026-05-05 10:32:43'),
('2d7a5b84-ba2c-4f62-bc50-820eef79ce8c', '1c197e49-aaf2-4f46-80a7-142753a98d97', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 21:02:00.', 0, '2026-05-04 17:14:13'),
('2f659086-e7bf-455b-9424-c809edb6eb9c', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'New meeting scheduled', 'A new meeting \"test\" is scheduled from 2026-05-04 13:44:00 to 2026-05-04 14:47:00.', 1, '2026-05-04 10:44:05'),
('30985a45-fd84-4186-8822-eb0643e9dca9', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 13:27:00 to 2026-05-04 14:28:00.', 1, '2026-05-04 10:26:43'),
('31b6789a-a259-4c39-8da9-007c4a485428', '698f27be-f68c-4692-84ba-49ba5fc63769', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 20:00:00.', 1, '2026-05-04 16:59:15'),
('32667188-c7cc-423e-9b31-54259899238d', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-03 13:19:00 to 2026-05-04 04:26:00.', 1, '2026-05-03 22:17:44'),
('3287675c-d406-4318-9e75-1287cc67da8a', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 20:58:00.', 1, '2026-05-04 16:58:37'),
('33b9a174-8dff-4519-9075-379ee26db7c8', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting deleted', 'The meeting \"test\" scheduled for Mon May 04 2026 13:27:00 GMT+0300 (Eastern European Summer Time) has been deleted.', 1, '2026-05-04 10:42:58'),
('36bc52ad-ddbd-4402-9f3b-266a28966258', '35917b43-1e2b-40cd-bfa7-59de18e0330d', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'New meeting scheduled', 'A new meeting \"test\" is scheduled from 2026-05-04 13:08:00 to 2026-05-04 14:11:00.', 1, '2026-05-04 10:07:14'),
('36f26176-a618-4ad6-a1e1-cb29a7f5d1e8', '1c197e49-aaf2-4f46-80a7-142753a98d97', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-03 13:14:00 to 2026-05-04 04:26:00.', 1, '2026-05-03 22:13:50'),
('3763a37b-f41d-4e06-ba9d-cb15419f9e35', '1c197e49-aaf2-4f46-80a7-142753a98d97', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'New meeting scheduled', 'A new meeting \"test\" is scheduled from 2026-05-04 13:14:00 to 2026-05-04 14:16:00.', 1, '2026-05-04 10:13:03'),
('377c8ed5-2a1c-4ec1-9b45-08c2e234ae26', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'New meeting scheduled', 'A new meeting \"test\" is scheduled from 2026-05-05 13:34:00 to 2026-05-05 16:32:00.', 0, '2026-05-05 10:33:18'),
('37ca79f9-6986-48a9-aac1-3d8158a9d423', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 21:00:00.', 1, '2026-05-04 17:12:25'),
('38c9dd50-2f9e-447d-8533-c969415696d8', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting series deleted', 'The weekly meeting series \"test\" has been deleted forever.', 1, '2026-05-04 10:09:32'),
('39228085-71d5-4b40-8e50-0ec28f304a5a', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 21:02:00.', 1, '2026-05-04 17:16:39'),
('3b379cb5-bb5d-4ffc-809b-d353545a98dd', '35917b43-1e2b-40cd-bfa7-59de18e0330d', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'New meeting scheduled', 'A new meeting \"test\" is scheduled from 2026-05-04 19:54:00 to 2026-05-04 20:55:00.', 1, '2026-05-04 16:52:36'),
('3e8a37d8-e79f-420f-81b3-6eb6ab16e8d8', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'New meeting scheduled', 'A new meeting \"test\" is scheduled from 2026-05-04 13:08:00 to 2026-05-04 14:11:00.', 1, '2026-05-04 10:07:14'),
('3fba5f60-8891-4be8-9ed0-07b9670281fa', '698f27be-f68c-4692-84ba-49ba5fc63769', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting series deleted', 'The weekly meeting series \"test\" has been deleted forever.', 1, '2026-05-04 10:09:32'),
('4011102a-4f1b-46ce-bacf-2716a5a40b5e', '0264a84d-d735-4e4a-967b-ba67eed05c58', 'fd0ab158-667b-499a-b74d-267a5e102a34', 'New group pending approval', 'A new group \"test\" is waiting for your approval.', 1, '2026-05-03 17:34:40'),
('40a10e24-d563-4d9a-a98f-9ae9d5996742', '698f27be-f68c-4692-84ba-49ba5fc63769', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'New meeting scheduled', 'A new meeting \"test\" is scheduled from 2026-05-04 13:22:00 to 2026-05-04 14:22:00.', 1, '2026-05-04 10:21:50'),
('40e86684-8dae-4fbe-9ebd-928238ae305c', '698f27be-f68c-4692-84ba-49ba5fc63769', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 21:05:00.', 1, '2026-05-04 17:19:48'),
('4209ed38-6f33-4c12-b8a1-5a01383e0944', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-03 13:04:00 to 2026-05-04 04:26:00.', 1, '2026-05-03 22:03:42'),
('42879ba6-e059-4594-9085-6df0fe591dfd', '35917b43-1e2b-40cd-bfa7-59de18e0330d', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'New meeting scheduled', 'A new meeting \"test\" is scheduled from 2026-05-04 13:14:00 to 2026-05-04 14:16:00.', 1, '2026-05-04 10:13:03'),
('433ff245-e4eb-48e9-93d4-4b24f9e91364', 'cae09d05-7a25-4714-bd33-2410319f9cc3', 'fd0ab158-667b-499a-b74d-267a5e102a34', 'New group pending approval', 'A new group \"test\" is waiting for your approval.', 0, '2026-05-03 17:34:49'),
('4598d44b-20c4-425a-8731-150bf9ef51ac', '35917b43-1e2b-40cd-bfa7-59de18e0330d', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting deleted', 'The meeting \"test\" scheduled for Mon May 04 2026 13:44:00 GMT+0300 (Eastern European Summer Time) has been deleted.', 1, '2026-05-04 16:40:11'),
('4649ebb4-5be3-449e-aa32-5da33b35687f', '698f27be-f68c-4692-84ba-49ba5fc63769', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 13:27:00 to 2026-05-04 16:28:00.', 1, '2026-05-04 10:31:19'),
('483e2459-2b90-4c4f-a621-0d979abeef93', '698f27be-f68c-4692-84ba-49ba5fc63769', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"Graduation meeting\" has been updated. New schedule: 2026-05-03 21:18:00 to 2026-05-03 23:12:00.', 1, '2026-05-03 18:16:27'),
('487b2a8e-5fa6-43d8-b1e4-1b8226a4b261', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-03 13:04:00 to 2026-05-04 04:26:00.', 1, '2026-05-03 22:03:42'),
('49134c48-3077-4620-b447-94f7f862b645', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting series deleted', 'The weekly meeting series \"test\" has been deleted forever.', 1, '2026-05-04 10:09:32'),
('4a660935-efa1-47d0-b7e2-f43ea5162baa', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 13:09:00 to 2026-05-04 14:26:00.', 1, '2026-05-04 10:03:56'),
('4bb29344-3954-45e2-b4c0-76b4afd1350e', '1c197e49-aaf2-4f46-80a7-142753a98d97', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting deleted', 'The meeting \"test\" scheduled for Mon May 04 2026 13:12:00 GMT+0300 (Eastern European Summer Time) has been deleted.', 1, '2026-05-04 10:12:14'),
('4d4970a5-31f5-4082-b152-3e775e8ea360', '35917b43-1e2b-40cd-bfa7-59de18e0330d', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 13:27:00 to 2026-05-04 16:28:00.', 1, '2026-05-04 10:31:19'),
('4d60ebc8-a08a-4530-93c6-9d1f27d7741b', '1c197e49-aaf2-4f46-80a7-142753a98d97', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 20:56:00.', 0, '2026-05-04 16:57:46'),
('4ef0d36b-bd9d-4f37-9798-76ff89e67ef1', 'cae09d05-7a25-4714-bd33-2410319f9cc3', 'fd0ab158-667b-499a-b74d-267a5e102a34', 'New group pending approval', 'A new group \"test\" is waiting for your approval.', 0, '2026-05-03 17:34:39'),
('4f612af8-de53-47e4-ae59-60d889d5f08b', '1c197e49-aaf2-4f46-80a7-142753a98d97', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting deleted', 'The meeting \"test\" scheduled for Mon May 04 2026 13:06:00 GMT+0300 (Eastern European Summer Time) has been deleted.', 1, '2026-05-04 10:06:24'),
('4f905a24-2ba0-4ea8-8726-b1d7a2682013', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"Graduation meeting\" has been updated. New schedule: 2026-05-03 20:47:00 to 2026-05-05 21:00:00.', 1, '2026-05-05 10:32:26'),
('4faa1406-f610-4f9a-85d7-9fe434db3a07', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 20:55:00.', 1, '2026-05-04 16:53:09'),
('50a6f79f-0b8d-40a9-8ba2-8f68ce4995e5', '698f27be-f68c-4692-84ba-49ba5fc63769', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'New meeting scheduled', 'A new meeting \"test\" is scheduled from 2026-05-04 13:44:00 to 2026-05-04 14:47:00.', 1, '2026-05-04 10:44:05'),
('51ae38d2-13c4-44df-a102-2b2fe1fb85fa', '698f27be-f68c-4692-84ba-49ba5fc63769', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 20:56:00.', 1, '2026-05-04 16:57:46'),
('5229964d-ed7c-47f0-bbd4-8dc8eb2ca642', '698f27be-f68c-4692-84ba-49ba5fc63769', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 21:02:00.', 1, '2026-05-04 17:14:13'),
('52863c6f-eb91-4c02-892d-5e0cfab32179', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'New meeting scheduled', 'A new meeting \"test\" is scheduled from 2026-05-05 13:34:00 to 2026-05-05 16:32:00.', 1, '2026-05-05 10:33:18'),
('53d5192f-8623-48ee-98f6-ca3b927f9930', '35917b43-1e2b-40cd-bfa7-59de18e0330d', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-03 23:46:00 to 2026-05-04 01:26:00.', 1, '2026-05-03 21:31:21'),
('55698f28-2a32-425b-bed7-a96d15afd9a8', '35917b43-1e2b-40cd-bfa7-59de18e0330d', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 20:58:00.', 0, '2026-05-04 17:06:38'),
('5717a15b-0a40-436d-9456-9e62bd6212f1', '9a5becdf-22bd-47de-85c9-f0e66063e379', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'New group pending approval', 'A new group \"Comp Test\" is waiting for your approval.', 1, '2026-05-03 17:07:07'),
('58f29aee-442c-4412-8ea1-b3610a5bebbb', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'New meeting scheduled', 'A new meeting \"test\" is scheduled from 2026-05-04 19:54:00 to 2026-05-04 20:55:00.', 1, '2026-05-04 16:52:36'),
('5a07aa5d-8014-4868-8321-bd024651c03c', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 13:08:00 to 2026-05-04 13:15:00.', 1, '2026-05-04 10:08:15'),
('5b267946-414f-4e8e-936e-a2a1140e62c6', '62d55667-2fd7-4e8c-885e-b86672512e29', '72ccdd7d-f991-40c3-850b-35a944f9da41', 'New meeting scheduled', 'A new meeting \"test\" is scheduled from 2026-05-03 20:52:00 to 2026-05-04 21:51:00.', 1, '2026-05-03 17:52:04'),
('5ba0e921-c8ea-4216-9bc8-55c851c3b7a4', '1c197e49-aaf2-4f46-80a7-142753a98d97', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-03 13:22:00 to 2026-05-04 04:26:00.', 1, '2026-05-03 22:19:37'),
('5c067b43-5d03-4550-bdf6-48b6afb2e658', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 13:09:00 to 2026-05-04 13:15:00.', 1, '2026-05-04 10:08:27'),
('5dba0a8a-8d89-45e3-b51b-2e7c4e8487a7', '1c197e49-aaf2-4f46-80a7-142753a98d97', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 13:09:00 to 2026-05-04 13:15:00.', 1, '2026-05-04 10:08:27'),
('5e6d7415-1877-4739-8bc3-b182cc478e09', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'New meeting scheduled', 'A new meeting \"test\" is scheduled from 2026-05-04 13:22:00 to 2026-05-04 14:22:00.', 1, '2026-05-04 10:21:50'),
('5ecdcb33-58a9-471b-b593-5b4de910cf72', '698f27be-f68c-4692-84ba-49ba5fc63769', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'New meeting scheduled', 'A new meeting \"test\" is scheduled from 2026-05-04 13:08:00 to 2026-05-04 14:11:00.', 1, '2026-05-04 10:07:14'),
('5ee82470-1e3c-4f67-b374-b102c48ead41', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'New meeting scheduled', 'A new meeting \"test\" is scheduled from 2026-05-04 13:14:00 to 2026-05-04 14:16:00.', 1, '2026-05-04 10:13:03'),
('5ef3e456-8b5b-404d-9fea-0cc6ad4e4bc2', '698f27be-f68c-4692-84ba-49ba5fc63769', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'New meeting scheduled', 'A new meeting \"test\" is scheduled from 2026-05-03 23:28:00 to 2026-05-04 00:26:00.', 1, '2026-05-03 20:26:58'),
('618c445a-3cbc-4f73-b740-75ef3b385ac7', '1c197e49-aaf2-4f46-80a7-142753a98d97', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 20:00:00.', 0, '2026-05-04 16:59:16'),
('62bd3885-f124-4e8f-af21-f44ed7eddf99', '35917b43-1e2b-40cd-bfa7-59de18e0330d', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-03 13:22:00 to 2026-05-04 04:26:00.', 1, '2026-05-03 22:19:37'),
('631fb0b6-246a-477d-8983-a6d14565f082', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 21:05:00.', 1, '2026-05-04 17:15:12'),
('641294cc-c19d-4b80-b89b-e43df0347f63', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'New meeting scheduled', 'A new meeting \"test\" is scheduled from 2026-05-04 13:12:00 to 2026-05-04 14:14:00.', 1, '2026-05-04 10:11:52'),
('66a8b662-2bab-4186-8c2a-f9b928e5fcbb', '698f27be-f68c-4692-84ba-49ba5fc63769', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-03 13:04:00 to 2026-05-04 04:26:00.', 1, '2026-05-03 22:03:42'),
('6700fa1e-c547-4d20-96da-3b1e5db87b44', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting deleted', 'The meeting \"test\" scheduled for Mon May 04 2026 13:44:00 GMT+0300 (Eastern European Summer Time) has been deleted.', 1, '2026-05-04 16:40:11'),
('68d9ec76-16ef-40bb-8e06-5ec1c1307141', '1c197e49-aaf2-4f46-80a7-142753a98d97', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 21:05:00.', 0, '2026-05-04 17:15:12'),
('68da140a-3810-4b8a-b9e9-37dc459cda8b', '698f27be-f68c-4692-84ba-49ba5fc63769', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting deleted', 'The meeting \"test\" scheduled for Mon May 04 2026 13:06:00 GMT+0300 (Eastern European Summer Time) has been deleted.', 1, '2026-05-04 10:06:24'),
('69021522-1756-4c91-861d-d7ac10258906', '1c197e49-aaf2-4f46-80a7-142753a98d97', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 13:08:00 to 2026-05-04 13:15:00.', 1, '2026-05-04 10:08:15'),
('6a367640-603f-4c68-930d-56fd83e80656', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-03 13:17:00 to 2026-05-04 04:26:00.', 1, '2026-05-03 22:14:59'),
('6b25f58e-5c44-4a47-8ddc-7966dada4b3f', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"Graduation meeting\" has been updated. New schedule: 2026-05-03 20:47:00 to 2026-05-03 21:00:00.', 1, '2026-05-05 10:32:43'),
('6da97399-c235-4a85-87a7-0a681a0a0fc6', '698f27be-f68c-4692-84ba-49ba5fc63769', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-03 14:22:00 to 2026-05-04 04:26:00.', 1, '2026-05-03 22:19:12'),
('6fbf106b-42b3-4cfb-882b-61b80158c505', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 20:58:00.', 1, '2026-05-04 16:58:37'),
('7066c49d-505d-43ee-871f-5ae8d56f730a', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-03 23:45:00 to 2026-05-04 00:26:00.', 1, '2026-05-03 20:44:44'),
('7276399d-89bc-4c37-af28-d699c049a16e', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 13:27:00 to 2026-05-04 16:28:00.', 1, '2026-05-04 10:31:19'),
('735d483c-aa4a-4eb3-b23c-8c5b5436c5e3', '35917b43-1e2b-40cd-bfa7-59de18e0330d', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 20:00:00.', 0, '2026-05-04 16:59:16'),
('74e78fc5-6cdb-4677-a831-bda36fb5cd71', '0264a84d-d735-4e4a-967b-ba67eed05c58', 'fd0ab158-667b-499a-b74d-267a5e102a34', 'New group pending approval', 'A new group \"test\" is waiting for your approval.', 1, '2026-05-03 17:34:39'),
('75dc2950-17bd-40fd-8012-7a42b494dfee', '35917b43-1e2b-40cd-bfa7-59de18e0330d', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 13:09:00 to 2026-05-04 13:15:00.', 1, '2026-05-04 10:08:27'),
('760108ed-9d59-4c0f-a62d-dd9b1c98a7d4', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 13:44:00 to 2026-05-04 18:47:00.', 1, '2026-05-04 11:48:20'),
('77b623f3-bbf8-4bee-b7c1-a11293be0e70', '698f27be-f68c-4692-84ba-49ba5fc63769', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 20:55:00.', 1, '2026-05-04 16:53:09'),
('78ae73a5-af9d-4555-b170-e79ffb122c74', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Graduation Project Content has been updated in Graduation Project', 'The content \"Graduation Project Content\" has been updated in your group \"Graduation Project\".', 0, '2026-05-05 15:34:34'),
('791c7869-662e-4e28-b7bd-02d6dcf6c567', '35917b43-1e2b-40cd-bfa7-59de18e0330d', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-03 13:25:00 to 2026-05-04 04:26:00.', 1, '2026-05-03 22:20:52'),
('799da4fb-f29b-4a90-87f6-45305afefab2', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"Graduation meeting\" has been updated. New schedule: 2026-05-04 20:47:00 to 2026-05-05 01:19:00.', 0, '2026-05-04 21:54:48'),
('7ab60b92-a726-4fdc-b01a-bfeb8fa70c5a', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 13:27:00 to 2026-05-04 13:28:00.', 1, '2026-05-04 10:27:28'),
('7acee45b-3e55-4dd4-8963-5a0f6723829c', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 13:44:00 to 2026-05-04 18:47:00.', 1, '2026-05-04 11:48:20'),
('7c61044e-5901-4a6d-a1b3-a462085d5096', '1c197e49-aaf2-4f46-80a7-142753a98d97', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting deleted', 'The meeting \"test\" scheduled for Mon May 04 2026 13:14:00 GMT+0300 (Eastern European Summer Time) has been deleted.', 1, '2026-05-04 10:14:12'),
('7c77a058-6d10-4ff3-aa40-d8fbeb19b072', '698f27be-f68c-4692-84ba-49ba5fc63769', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'New meeting scheduled', 'A new meeting \"test\" is scheduled from 2026-05-04 13:12:00 to 2026-05-04 14:14:00.', 1, '2026-05-04 10:11:52'),
('7d3ce3f1-7510-4ffd-afef-2b19f7d44d85', '698f27be-f68c-4692-84ba-49ba5fc63769', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting deleted', 'The meeting \"test\" scheduled for Mon May 04 2026 13:44:00 GMT+0300 (Eastern European Summer Time) has been deleted.', 1, '2026-05-04 16:40:11'),
('7de4ff3c-a174-4b50-b519-fb8266356e55', '35917b43-1e2b-40cd-bfa7-59de18e0330d', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 22:00:00.', 0, '2026-05-04 17:09:49'),
('7e9c0267-bc3d-4bf6-99b7-b05997a709f9', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 21:05:00.', 1, '2026-05-04 17:19:48'),
('7f3656af-2142-458c-b3db-fc4dcec25116', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'New meeting scheduled', 'A new meeting \"test\" is scheduled from 2026-05-04 13:22:00 to 2026-05-04 14:22:00.', 1, '2026-05-04 10:21:50'),
('80ae2e4a-6ce3-44ba-a9b3-3e823533d700', '35917b43-1e2b-40cd-bfa7-59de18e0330d', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 13:08:00 to 2026-05-04 14:11:00.', 1, '2026-05-04 10:07:39'),
('80dd19f8-b013-4c91-9a66-7605171d390e', '698f27be-f68c-4692-84ba-49ba5fc63769', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'New meeting scheduled', 'A new meeting \"test\" is scheduled from 2026-05-04 13:14:00 to 2026-05-04 14:16:00.', 1, '2026-05-04 10:13:03'),
('840069ba-7fc0-4c9b-a060-27ee4da185ce', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 23:00:00.', 1, '2026-05-04 17:13:30'),
('8909e399-5203-4e3a-b285-951c269e2676', '35917b43-1e2b-40cd-bfa7-59de18e0330d', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 13:44:00 to 2026-05-04 18:47:00.', 1, '2026-05-04 11:48:20'),
('8d63ee28-33fc-4cc5-9bac-b0f8f4458698', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'New meeting scheduled', 'A new meeting \"test\" is scheduled from 2026-05-03 23:28:00 to 2026-05-04 00:26:00.', 1, '2026-05-03 20:26:58'),
('8f27fa7d-0638-49f6-8dff-7d21c569e3e5', '698f27be-f68c-4692-84ba-49ba5fc63769', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 20:58:00.', 1, '2026-05-04 16:58:37'),
('900e096d-43d3-4d00-abba-b781f6de308a', '1c197e49-aaf2-4f46-80a7-142753a98d97', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'New meeting scheduled', 'A new meeting \"test\" is scheduled from 2026-05-03 23:28:00 to 2026-05-04 00:26:00.', 1, '2026-05-03 20:26:58'),
('9041a1ea-cef8-48a0-8ca3-afe996faeb4f', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-03 23:46:00 to 2026-05-04 01:26:00.', 1, '2026-05-03 21:31:21'),
('9103a18a-9dcb-4db2-ba4e-100e7d4359bf', '35917b43-1e2b-40cd-bfa7-59de18e0330d', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 13:06:00 to 2026-05-04 14:26:00.', 1, '2026-05-04 10:05:08'),
('913db965-b763-495d-a30d-11a77ba29686', '698f27be-f68c-4692-84ba-49ba5fc63769', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting deleted', 'The meeting \"test\" scheduled for Mon May 04 2026 13:14:00 GMT+0300 (Eastern European Summer Time) has been deleted.', 1, '2026-05-04 10:14:12'),
('92bcc221-0832-44c2-b5e6-1357dace24c9', '1c197e49-aaf2-4f46-80a7-142753a98d97', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting deleted', 'The meeting \"test\" scheduled for Mon May 04 2026 13:44:00 GMT+0300 (Eastern European Summer Time) has been deleted.', 0, '2026-05-04 16:40:11'),
('95a1a9a7-96a9-4031-b230-784eb5aaf309', '0264a84d-d735-4e4a-967b-ba67eed05c58', '0264a84d-d735-4e4a-967b-ba67eed05c58', 'Approval recorded', 'You approved \"test\". The group is now active.', 1, '2026-05-03 17:36:21'),
('962899e7-d506-4406-8c95-02480998b581', '35917b43-1e2b-40cd-bfa7-59de18e0330d', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-03 13:14:00 to 2026-05-04 04:26:00.', 1, '2026-05-03 22:13:50'),
('971093cd-739a-4d20-8903-1af9c7c894f6', '1c197e49-aaf2-4f46-80a7-142753a98d97', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'New meeting scheduled', 'A new meeting \"test\" is scheduled from 2026-05-04 19:54:00 to 2026-05-04 20:55:00.', 0, '2026-05-04 16:52:36'),
('9714e4f7-c9b1-4cc7-9439-d4fe48dbfaa7', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 13:27:00 to 2026-05-04 14:28:00.', 1, '2026-05-04 10:26:43'),
('97a7753e-b848-4c7a-83a1-181a2ab28191', '1c197e49-aaf2-4f46-80a7-142753a98d97', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 20:58:00.', 0, '2026-05-04 17:06:38'),
('97ffe44e-eadb-46d7-90a0-a92a346c2123', '698f27be-f68c-4692-84ba-49ba5fc63769', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 13:44:00 to 2026-05-04 18:47:00.', 1, '2026-05-04 11:48:20'),
('98185fc0-2e49-4c36-ba66-72d7ad750f68', '1c197e49-aaf2-4f46-80a7-142753a98d97', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-03 13:17:00 to 2026-05-04 04:26:00.', 1, '2026-05-03 22:14:59'),
('985ca025-ea6b-484e-a33d-5a6b023f1a44', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 13:06:00 to 2026-05-04 13:10:00.', 1, '2026-05-04 10:05:36'),
('995ab52c-5886-49e6-b42a-616a833ea356', '698f27be-f68c-4692-84ba-49ba5fc63769', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 20:58:00.', 1, '2026-05-04 17:06:38'),
('9a44b16b-5517-444d-9cc7-316b934bac22', '698f27be-f68c-4692-84ba-49ba5fc63769', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-03 13:14:00 to 2026-05-04 04:26:00.', 1, '2026-05-03 22:13:50'),
('9bdd9340-acf4-427b-863e-425010dce4dc', 'fd0ab158-667b-499a-b74d-267a5e102a34', '0264a84d-d735-4e4a-967b-ba67eed05c58', 'Group approved', 'Your group \"test\" was approved by Shahd Saeedd.', 1, '2026-05-03 17:36:16'),
('9be84a7d-e60c-41e2-bbfe-d072238a1789', '1c197e49-aaf2-4f46-80a7-142753a98d97', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'New meeting scheduled', 'A new meeting \"test\" is scheduled from 2026-05-04 13:44:00 to 2026-05-04 14:47:00.', 1, '2026-05-04 10:44:05'),
('9c94c771-ff3c-4f5f-8abc-41984a5ae882', '9a5becdf-22bd-47de-85c9-f0e66063e379', '9a5becdf-22bd-47de-85c9-f0e66063e379', 'Approval recorded', 'You approved \"Comp Test\". The group is now active.', 1, '2026-05-03 17:07:41'),
('9d319803-c051-4008-84f5-bb1ba0f3be20', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting deleted', 'The meeting \"test\" scheduled for Mon May 04 2026 13:27:00 GMT+0300 (Eastern European Summer Time) has been deleted.', 1, '2026-05-04 10:42:58'),
('9d47f89e-9719-4728-8b9d-ffe4633fd0fb', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 23:00:00.', 1, '2026-05-04 17:13:30'),
('9e88150d-4b66-4562-ad99-9b462c87fa56', '698f27be-f68c-4692-84ba-49ba5fc63769', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-03 13:19:00 to 2026-05-04 04:26:00.', 1, '2026-05-03 22:17:44'),
('9f347516-217a-4cd0-88d2-ece2695a2d0c', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting deleted', 'The meeting \"test\" scheduled for Mon May 04 2026 13:12:00 GMT+0300 (Eastern European Summer Time) has been deleted.', 1, '2026-05-04 10:12:14'),
('a228fe41-1d65-4c1b-8ed1-f49a0b8dc340', '1c197e49-aaf2-4f46-80a7-142753a98d97', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 13:08:00 to 2026-05-04 14:11:00.', 1, '2026-05-04 10:07:39'),
('a4989a7a-7606-487e-8404-813e4e347751', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"Graduation meeting\" has been updated. New schedule: 2026-05-04 20:47:00 to 2026-05-04 23:50:00.', 1, '2026-05-04 18:51:54'),
('a545c897-22fd-41be-b9a8-9124882f1272', '0264a84d-d735-4e4a-967b-ba67eed05c58', 'fd0ab158-667b-499a-b74d-267a5e102a34', 'New group pending approval', 'A new group \"test\" is waiting for your approval.', 1, '2026-05-03 17:34:46'),
('a57f41a2-56cc-4fcd-8588-d0663e5ec1d6', '0264a84d-d735-4e4a-967b-ba67eed05c58', 'fd0ab158-667b-499a-b74d-267a5e102a34', 'New group pending approval', 'A new group \"test\" is waiting for your approval.', 1, '2026-05-03 17:34:49'),
('a5d62eaf-9418-4d88-b78f-b661a7afa789', '698f27be-f68c-4692-84ba-49ba5fc63769', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 13:09:00 to 2026-05-04 14:26:00.', 1, '2026-05-04 10:03:56'),
('a6438356-d0b7-4db7-b611-5f0c6c2d2dad', '35917b43-1e2b-40cd-bfa7-59de18e0330d', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 13:27:00 to 2026-05-04 13:28:00.', 1, '2026-05-04 10:27:28'),
('a8cc8622-1f91-46ac-ace0-cb5def632ed7', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-03 13:22:00 to 2026-05-04 04:26:00.', 1, '2026-05-03 22:19:37'),
('a8ef584f-ee26-43f1-92ee-18ab85bc0760', '1c197e49-aaf2-4f46-80a7-142753a98d97', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 13:27:00 to 2026-05-04 14:28:00.', 1, '2026-05-04 10:26:43'),
('aa05ef29-a61d-43f6-a511-525e4477b120', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 13:08:00 to 2026-05-04 14:11:00.', 1, '2026-05-04 10:07:39'),
('aa2ecc4f-50ea-4923-be76-3c0d237673c0', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 13:09:00 to 2026-05-04 13:15:00.', 1, '2026-05-04 10:08:27'),
('abda7f6f-5150-45b8-990d-f6a70ffe4218', '35917b43-1e2b-40cd-bfa7-59de18e0330d', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 13:08:00 to 2026-05-04 13:15:00.', 1, '2026-05-04 10:08:15'),
('abdd1a60-2ed2-4e89-916b-eb76cbd96896', '1c197e49-aaf2-4f46-80a7-142753a98d97', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 13:27:00 to 2026-05-04 16:28:00.', 1, '2026-05-04 10:31:19'),
('ac4b9fd8-b443-431d-afb9-d8324f9ca035', '698f27be-f68c-4692-84ba-49ba5fc63769', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 13:09:00 to 2026-05-04 13:15:00.', 1, '2026-05-04 10:08:27'),
('ac954876-2562-4a19-a8ae-03e692757a0e', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 13:09:00 to 2026-05-04 14:26:00.', 1, '2026-05-04 10:03:56'),
('ace9f594-2670-4bd5-ba00-cd0a9feae9f3', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-03 13:19:00 to 2026-05-04 04:26:00.', 1, '2026-05-03 22:17:44'),
('adb91b3a-a6f5-4842-82dd-127b459c35f4', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-03 13:25:00 to 2026-05-04 04:26:00.', 1, '2026-05-03 22:20:52'),
('ae4e7b6b-24a6-49a8-957a-7c6cf0515b0b', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting deleted', 'The meeting \"test\" scheduled for Mon May 04 2026 13:06:00 GMT+0300 (Eastern European Summer Time) has been deleted.', 1, '2026-05-04 10:06:24'),
('b0b3b1dc-82a9-4fb4-8472-1c8b9e5f7592', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 21:02:00.', 1, '2026-05-04 17:14:13'),
('b2f39ded-9a70-41b9-b9ec-e6437a7b324b', '698f27be-f68c-4692-84ba-49ba5fc63769', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'New meeting scheduled', 'A new meeting \"Graduation meeting\" is scheduled from 2026-05-03 21:30:00 to 2026-05-03 23:12:00.', 1, '2026-05-03 18:14:04'),
('b38ccc41-9edd-41f3-a1d0-976cbd4d511b', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-03 14:22:00 to 2026-05-04 04:26:00.', 1, '2026-05-03 22:19:12'),
('b8162423-7076-4c5d-a1a4-38dce9865188', '35917b43-1e2b-40cd-bfa7-59de18e0330d', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 13:09:00 to 2026-05-04 14:26:00.', 1, '2026-05-04 10:03:56'),
('b817a9b9-6c42-4076-8fd0-949f5f453b03', '698f27be-f68c-4692-84ba-49ba5fc63769', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 21:00:00.', 1, '2026-05-04 17:12:25'),
('b98192d0-38ca-4fd5-a130-2a67cce60bb9', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 13:08:00 to 2026-05-04 13:15:00.', 1, '2026-05-04 10:08:15'),
('ba05123f-d330-4aa4-904f-341428865e14', '698f27be-f68c-4692-84ba-49ba5fc63769', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 13:27:00 to 2026-05-04 13:28:00.', 1, '2026-05-04 10:27:28'),
('ba795342-bdb7-4ac0-ba71-1505e5cac2f8', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting deleted', 'The meeting \"test\" scheduled for Mon May 04 2026 13:44:00 GMT+0300 (Eastern European Summer Time) has been deleted.', 1, '2026-05-04 16:40:11'),
('bafa91ce-3ac3-49b2-90ba-a2e6725dc404', 'cae09d05-7a25-4714-bd33-2410319f9cc3', 'fd0ab158-667b-499a-b74d-267a5e102a34', 'New group pending approval', 'A new group \"test\" is waiting for your approval.', 0, '2026-05-03 17:34:46'),
('bbf0f869-a4f9-49ab-809a-fc1a90f974b6', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 20:56:00.', 1, '2026-05-04 16:57:46');
INSERT INTO `notifications` (`id`, `member_id`, `sender_id`, `title`, `message`, `is_read`, `created_at`) VALUES
('bd1fa9b7-dcde-43fd-92cc-51c974cc22cc', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 13:06:00 to 2026-05-04 14:26:00.', 1, '2026-05-04 10:05:08'),
('bd5a7ebb-6110-4708-8a5f-7bc06eb6d6d3', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"Graduation meeting\" has been updated. New schedule: 2026-05-04 20:47:00 to 2026-05-05 01:19:00.', 1, '2026-05-04 21:54:48'),
('bd96ac8d-637a-4ba9-b586-66c5abdf604a', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 22:00:00.', 1, '2026-05-04 17:09:49'),
('bded43e0-3d4b-4768-b895-eddbe212f9b1', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting deleted', 'The meeting \"test\" scheduled for Mon May 04 2026 13:14:00 GMT+0300 (Eastern European Summer Time) has been deleted.', 1, '2026-05-04 10:14:12'),
('bf047cb4-15d3-40d3-9018-7c8d2e7fc384', '35917b43-1e2b-40cd-bfa7-59de18e0330d', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 20:55:00.', 0, '2026-05-04 16:53:09'),
('c0348477-b301-4114-a997-7f3e3934f362', '35917b43-1e2b-40cd-bfa7-59de18e0330d', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 23:00:00.', 0, '2026-05-04 17:13:30'),
('c088b387-f7b9-4ce9-a0f5-eb3203f4d534', '9a5becdf-22bd-47de-85c9-f0e66063e379', 'fd0ab158-667b-499a-b74d-267a5e102a34', 'New group pending approval', 'A new group \"test\" is waiting for your approval.', 0, '2026-05-03 17:34:49'),
('c1a8eccc-52ac-4742-9927-a7fdd67adf9b', '9a5becdf-22bd-47de-85c9-f0e66063e379', 'fd0ab158-667b-499a-b74d-267a5e102a34', 'New group pending approval', 'A new group \"test\" is waiting for your approval.', 0, '2026-05-03 17:34:39'),
('c21c2406-7a61-42ff-ab8b-a82a9968f713', '1c197e49-aaf2-4f46-80a7-142753a98d97', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-03 23:45:00 to 2026-05-04 00:26:00.', 1, '2026-05-03 20:44:44'),
('c42be2a3-98e6-4305-8465-2bb4b541440f', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting deleted', 'The meeting \"test\" scheduled for Mon May 04 2026 13:12:00 GMT+0300 (Eastern European Summer Time) has been deleted.', 1, '2026-05-04 10:12:14'),
('c44c890f-38a7-4198-98a2-92e0dee38246', '1c197e49-aaf2-4f46-80a7-142753a98d97', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-03 14:22:00 to 2026-05-04 04:26:00.', 1, '2026-05-03 22:19:12'),
('c488ebf4-a3b0-48a1-a32f-e70f6190ef70', '35917b43-1e2b-40cd-bfa7-59de18e0330d', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting series deleted', 'The weekly meeting series \"test\" has been deleted forever.', 1, '2026-05-04 10:09:32'),
('c491b0e8-82eb-44ee-8b32-ebde90c0d706', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 21:00:00.', 1, '2026-05-04 17:12:25'),
('c5085efe-d052-435b-92cd-26d157c07364', '1c197e49-aaf2-4f46-80a7-142753a98d97', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'New meeting scheduled', 'A new meeting \"test\" is scheduled from 2026-05-04 13:12:00 to 2026-05-04 14:14:00.', 1, '2026-05-04 10:11:52'),
('c5143784-d780-4cae-aa8b-33b1a19bed37', '1c197e49-aaf2-4f46-80a7-142753a98d97', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 13:06:00 to 2026-05-04 13:10:00.', 1, '2026-05-04 10:05:36'),
('c58ebaeb-537c-4e29-a536-19accd4a9667', '1c197e49-aaf2-4f46-80a7-142753a98d97', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting deleted', 'The meeting \"test\" scheduled for Mon May 04 2026 13:27:00 GMT+0300 (Eastern European Summer Time) has been deleted.', 1, '2026-05-04 10:42:58'),
('c61546d2-c128-48fb-b13e-f906cfd5e0f8', '698f27be-f68c-4692-84ba-49ba5fc63769', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 21:05:00.', 1, '2026-05-04 17:15:12'),
('c7a5b5a4-6cab-48e1-bb3e-cb18d8241f42', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 20:58:00.', 1, '2026-05-04 17:06:38'),
('c8d986e7-e260-4ac8-b29c-daf89ae503f7', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'New meeting scheduled', 'A new meeting \"test\" is scheduled from 2026-05-04 19:54:00 to 2026-05-04 20:55:00.', 1, '2026-05-04 16:52:36'),
('c963226a-9106-43de-8880-64994a7b2627', 'cae09d05-7a25-4714-bd33-2410319f9cc3', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'New group pending approval', 'A new group \"Comp Test\" is waiting for your approval.', 0, '2026-05-03 17:07:07'),
('c965d09f-43b6-45d6-b518-7bacdb6529e1', '698f27be-f68c-4692-84ba-49ba5fc63769', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-03 23:46:00 to 2026-05-04 01:26:00.', 1, '2026-05-03 21:31:21'),
('cb8fc430-644c-45d1-9c97-91fe6d5080d3', '698f27be-f68c-4692-84ba-49ba5fc63769', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting deleted', 'The meeting \"test\" scheduled for Mon May 04 2026 13:27:00 GMT+0300 (Eastern European Summer Time) has been deleted.', 1, '2026-05-04 10:42:58'),
('ccc1f6af-b846-4ecc-b1db-7122200ced60', '35917b43-1e2b-40cd-bfa7-59de18e0330d', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-03 23:45:00 to 2026-05-04 00:26:00.', 1, '2026-05-03 20:44:44'),
('ccd377b5-96b7-4a1e-a770-618acfdb223b', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 21:02:00.', 1, '2026-05-04 17:14:13'),
('cd7a2b3c-cef5-4770-82e2-ee4cab5dc107', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'New meeting scheduled', 'A new meeting \"test\" is scheduled from 2026-05-04 13:44:00 to 2026-05-04 14:47:00.', 1, '2026-05-04 10:44:05'),
('cddeaddc-cfbf-4a55-922f-77edb90a6eaa', '1c197e49-aaf2-4f46-80a7-142753a98d97', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'New meeting scheduled', 'A new meeting \"test\" is scheduled from 2026-05-04 13:22:00 to 2026-05-04 14:22:00.', 1, '2026-05-04 10:21:50'),
('ce584486-54e1-458d-973d-70b9c2a824a4', '698f27be-f68c-4692-84ba-49ba5fc63769', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 13:08:00 to 2026-05-04 13:15:00.', 1, '2026-05-04 10:08:15'),
('d0e3297b-22ec-49b6-8efb-b07abd91bf4b', 'cae09d05-7a25-4714-bd33-2410319f9cc3', 'fd0ab158-667b-499a-b74d-267a5e102a34', 'New group pending approval', 'A new group \"test\" is waiting for your approval.', 0, '2026-05-03 17:34:44'),
('d1b3cdd4-3d94-42b1-9a36-1223ddca6783', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 21:02:00.', 1, '2026-05-04 17:16:39'),
('d1c661aa-516a-4a1f-aad5-b1c2006218ba', '1c197e49-aaf2-4f46-80a7-142753a98d97', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-03 13:04:00 to 2026-05-04 04:26:00.', 1, '2026-05-03 22:03:42'),
('d2063a9a-5e03-480a-be50-33b514a2a69f', '698f27be-f68c-4692-84ba-49ba5fc63769', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 13:06:00 to 2026-05-04 13:10:00.', 1, '2026-05-04 10:05:36'),
('d21db1df-1829-48e4-b7e4-28ecd1f9e4d9', '698f27be-f68c-4692-84ba-49ba5fc63769', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'New meeting scheduled', 'A new meeting \"test\" is scheduled from 2026-05-04 19:54:00 to 2026-05-04 20:55:00.', 1, '2026-05-04 16:52:36'),
('d26142ea-ae1f-4eb1-a3d2-677203372be2', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Graduation Project Content has been updated in Graduation Project', 'The content \"Graduation Project Content\" has been updated in your group \"Graduation Project\".', 1, '2026-05-05 15:34:48'),
('d2642049-36ae-4c61-b2c8-47c5251b6fe0', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 21:05:00.', 1, '2026-05-04 17:15:12'),
('d3000234-dfa4-4c2e-95ae-d8b7f55cfc4b', '1c197e49-aaf2-4f46-80a7-142753a98d97', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 22:00:00.', 0, '2026-05-04 17:09:48'),
('d42eaa2d-965d-42aa-8e39-72af61dc5cbf', '1c197e49-aaf2-4f46-80a7-142753a98d97', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'New meeting scheduled', 'A new meeting \"test\" is scheduled from 2026-05-04 13:08:00 to 2026-05-04 14:11:00.', 1, '2026-05-04 10:07:14'),
('d4374e11-59bf-46c2-8536-a6fc239cd69a', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 13:06:00 to 2026-05-04 14:26:00.', 1, '2026-05-04 10:05:08'),
('d5986fa5-e09a-4901-aab7-4672242c77fe', '35917b43-1e2b-40cd-bfa7-59de18e0330d', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 13:06:00 to 2026-05-04 13:10:00.', 1, '2026-05-04 10:05:36'),
('d61a0603-8d86-478f-b917-7ba92e506813', '35917b43-1e2b-40cd-bfa7-59de18e0330d', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-03 13:04:00 to 2026-05-04 04:26:00.', 1, '2026-05-03 22:03:42'),
('d7250665-34c8-4631-a018-07cabe4eb184', '35917b43-1e2b-40cd-bfa7-59de18e0330d', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 21:02:00.', 0, '2026-05-04 17:16:39'),
('d8acf4af-7660-4e71-b3ea-13bc9698ae68', '1c197e49-aaf2-4f46-80a7-142753a98d97', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-03 23:46:00 to 2026-05-04 01:26:00.', 1, '2026-05-03 21:31:21'),
('d9133007-5399-404e-9164-80f75e37ff3b', '1c197e49-aaf2-4f46-80a7-142753a98d97', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 20:55:00.', 0, '2026-05-04 16:53:09'),
('d9ca450d-4139-421d-9508-d92fd2c21f2f', '1c197e49-aaf2-4f46-80a7-142753a98d97', 'fd0ab158-667b-499a-b74d-267a5e102a34', 'Meeting series deleted', 'The weekly meeting series \"aaaa\" has been deleted forever.', 1, '2026-05-03 17:42:50'),
('daa226e2-2d51-44fc-a45d-568a3e6d9f4d', '1c197e49-aaf2-4f46-80a7-142753a98d97', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-03 13:19:00 to 2026-05-04 04:26:00.', 1, '2026-05-03 22:17:44'),
('daa65284-216c-46ac-ad23-5f865c22a3ad', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting deleted', 'The meeting \"test\" scheduled for Mon May 04 2026 13:06:00 GMT+0300 (Eastern European Summer Time) has been deleted.', 1, '2026-05-04 10:06:24'),
('dcb46b0f-f3d8-4fc9-ad0d-6187de8286c1', '35917b43-1e2b-40cd-bfa7-59de18e0330d', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting deleted', 'The meeting \"test\" scheduled for Mon May 04 2026 13:27:00 GMT+0300 (Eastern European Summer Time) has been deleted.', 1, '2026-05-04 10:42:58'),
('dd1402cd-0bd3-4864-b4b4-17341fe94ad1', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 20:55:00.', 1, '2026-05-04 16:53:09'),
('dd2399e7-9b2f-4638-b52c-7bb4f86195cd', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-03 23:46:00 to 2026-05-04 01:26:00.', 1, '2026-05-03 21:31:21'),
('dda8d70e-ccd3-4402-bbd3-6c2cd8b29e9f', '35917b43-1e2b-40cd-bfa7-59de18e0330d', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-03 13:17:00 to 2026-05-04 04:26:00.', 1, '2026-05-03 22:14:59'),
('dea46be0-8fc0-4733-8115-f8480d89adf0', '1c197e49-aaf2-4f46-80a7-142753a98d97', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 21:00:00.', 0, '2026-05-04 17:12:25'),
('dece5343-0fbf-4e3e-b2bf-b340deebdcd4', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-03 13:22:00 to 2026-05-04 04:26:00.', 1, '2026-05-03 22:19:37'),
('df4a86f4-6105-4b7d-bb01-8220d78dcf01', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"Graduation meeting\" has been updated. New schedule: 2026-05-05 20:47:00 to 2026-05-05 22:00:00.', 1, '2026-05-05 14:59:26'),
('df5e6b2e-9963-4fc0-b5dc-dd2d03928344', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-03 23:46:00 to 2026-05-04 00:26:00.', 1, '2026-05-03 20:45:27'),
('e0486474-f01c-470f-9853-414dad03e86d', '62d55667-2fd7-4e8c-885e-b86672512e29', 'fd0ab158-667b-499a-b74d-267a5e102a34', 'Meeting series deleted', 'The weekly meeting series \"aaaa\" has been deleted forever.', 1, '2026-05-03 17:42:50'),
('e1d80733-0404-458f-b6e6-3d84399af1fd', '35917b43-1e2b-40cd-bfa7-59de18e0330d', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'New meeting scheduled', 'A new meeting \"test\" is scheduled from 2026-05-04 13:44:00 to 2026-05-04 14:47:00.', 1, '2026-05-04 10:44:05'),
('e294f78b-7d72-4a48-b98e-8f842620861c', '9a5becdf-22bd-47de-85c9-f0e66063e379', 'fd0ab158-667b-499a-b74d-267a5e102a34', 'New group pending approval', 'A new group \"test\" is waiting for your approval.', 0, '2026-05-03 17:34:49'),
('e29c649e-d35d-4046-b830-84aecc70426a', '1c197e49-aaf2-4f46-80a7-142753a98d97', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-03 23:46:00 to 2026-05-04 00:26:00.', 1, '2026-05-03 20:45:27'),
('e38ffc0b-dbe3-41f3-bad3-f0dd87529f98', '35917b43-1e2b-40cd-bfa7-59de18e0330d', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-03 14:22:00 to 2026-05-04 04:26:00.', 1, '2026-05-03 22:19:12'),
('e3b4e864-ecec-41c4-a3b6-96136b7e5dec', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"Graduation meeting\" has been updated. New schedule: 2026-05-05 18:01:00 to 2026-05-05 22:00:00.', 0, '2026-05-05 15:00:25'),
('e4cb9c88-37c2-4a2e-823f-0b0b0af5c76b', '9a5becdf-22bd-47de-85c9-f0e66063e379', 'fd0ab158-667b-499a-b74d-267a5e102a34', 'New group pending approval', 'A new group \"test\" is waiting for your approval.', 0, '2026-05-03 17:34:46'),
('e624d313-9f5e-4e09-b882-353164ae1b21', '1c197e49-aaf2-4f46-80a7-142753a98d97', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 23:00:00.', 0, '2026-05-04 17:13:30'),
('e7100f3f-6b24-4fe9-a05e-166893235413', '35917b43-1e2b-40cd-bfa7-59de18e0330d', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'New meeting scheduled', 'A new meeting \"test\" is scheduled from 2026-05-04 13:12:00 to 2026-05-04 14:14:00.', 1, '2026-05-04 10:11:52'),
('e8967715-2a49-4a43-b7af-e25f4eac038b', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-03 13:14:00 to 2026-05-04 04:26:00.', 1, '2026-05-03 22:13:50'),
('e9971a47-b53a-4b24-9e5d-4dfef3643c22', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 22:00:00.', 1, '2026-05-04 17:09:48'),
('ec07bf2d-cb83-477c-b16b-328894aa4865', '1c197e49-aaf2-4f46-80a7-142753a98d97', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting series deleted', 'The weekly meeting series \"test\" has been deleted forever.', 1, '2026-05-04 10:09:32'),
('ed3cbf90-3b65-4dcd-90c3-9ba8f5946067', '35917b43-1e2b-40cd-bfa7-59de18e0330d', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'New meeting scheduled', 'A new meeting \"test\" is scheduled from 2026-05-03 23:28:00 to 2026-05-04 00:26:00.', 1, '2026-05-03 20:26:58'),
('edbbc41f-c938-4c4f-ba7c-1835f5808be5', '35917b43-1e2b-40cd-bfa7-59de18e0330d', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 21:02:00.', 0, '2026-05-04 17:14:13'),
('ee548b39-4675-469e-8a2d-cd8b75ed7e97', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 20:00:00.', 1, '2026-05-04 16:59:16'),
('ef02f1db-971b-4b91-bd58-47bfdf04937c', '35917b43-1e2b-40cd-bfa7-59de18e0330d', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting deleted', 'The meeting \"test\" scheduled for Mon May 04 2026 13:12:00 GMT+0300 (Eastern European Summer Time) has been deleted.', 1, '2026-05-04 10:12:14'),
('ef55ce11-1fb9-4f8c-84c5-9ae989255a3a', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 21:05:00.', 1, '2026-05-04 17:19:48'),
('f0203f99-6299-4c8e-a822-78c2fce1760e', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 13:08:00 to 2026-05-04 14:11:00.', 1, '2026-05-04 10:07:39'),
('f12e1bc4-edb6-4932-ba3e-45a802093a33', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting deleted', 'The meeting \"test\" scheduled for Mon May 04 2026 13:14:00 GMT+0300 (Eastern European Summer Time) has been deleted.', 1, '2026-05-04 10:14:12'),
('f489f9e4-b8f0-4e26-a6fd-d5c25ccd35cf', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-03 13:14:00 to 2026-05-04 04:26:00.', 1, '2026-05-03 22:13:50'),
('f4aa9f6a-2e25-431b-8470-a6844a57a390', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'New meeting scheduled', 'A new meeting \"test\" is scheduled from 2026-05-04 13:08:00 to 2026-05-04 14:11:00.', 1, '2026-05-04 10:07:14'),
('f4c93957-0d05-4c9a-b92f-addb2553ae6d', '1c197e49-aaf2-4f46-80a7-142753a98d97', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 13:44:00 to 2026-05-04 18:47:00.', 1, '2026-05-04 11:48:20'),
('f72bd670-1d87-451c-ac79-f1ce339f7fc1', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-03 13:25:00 to 2026-05-04 04:26:00.', 1, '2026-05-03 22:20:52'),
('f750a20e-0132-4d5b-b9f7-2c036976c125', '1c197e49-aaf2-4f46-80a7-142753a98d97', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 13:27:00 to 2026-05-04 13:28:00.', 1, '2026-05-04 10:27:28'),
('f91db8fc-567c-47b8-8615-73095dee2808', '62d55667-2fd7-4e8c-885e-b86672512e29', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-03 23:45:00 to 2026-05-04 00:26:00.', 1, '2026-05-03 20:44:44'),
('f932c87b-ad44-4ab8-b254-f974ddaef872', '698f27be-f68c-4692-84ba-49ba5fc63769', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 13:08:00 to 2026-05-04 14:11:00.', 1, '2026-05-04 10:07:39'),
('fadf1eef-cf9f-454f-8ace-baf7bc8a6bff', '35917b43-1e2b-40cd-bfa7-59de18e0330d', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 21:05:00.', 0, '2026-05-04 17:19:48'),
('fc768a2a-a0e8-4973-896b-463a4aac3c24', '35917b43-1e2b-40cd-bfa7-59de18e0330d', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 21:00:00.', 0, '2026-05-04 17:12:25'),
('fda8894c-9468-4ab8-98e4-2386bfb50736', '698f27be-f68c-4692-84ba-49ba5fc63769', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 22:00:00.', 1, '2026-05-04 17:09:49'),
('fdc85651-6503-46ad-b54a-41594628e048', '698f27be-f68c-4692-84ba-49ba5fc63769', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting deleted', 'The meeting \"test\" scheduled for Mon May 04 2026 13:12:00 GMT+0300 (Eastern European Summer Time) has been deleted.', 1, '2026-05-04 10:12:14'),
('fea26709-44cf-4fd4-b439-425feccdf55c', '8cb755a1-8101-4df0-a9c0-b03686bbc3cf', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 13:06:00 to 2026-05-04 13:10:00.', 1, '2026-05-04 10:05:36'),
('ff0e273e-3423-489d-9c7e-f82671e70e95', '35917b43-1e2b-40cd-bfa7-59de18e0330d', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 20:58:00.', 0, '2026-05-04 16:58:37'),
('ff88c880-c0f1-4ca8-92dd-ce2eeb240455', '1c197e49-aaf2-4f46-80a7-142753a98d97', '4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Meeting updated', 'The meeting \"test\" has been updated. New schedule: 2026-05-04 19:53:00 to 2026-05-04 20:58:00.', 0, '2026-05-04 16:58:37');

-- --------------------------------------------------------

--
-- Table structure for table `notification_pending_group_action`
--

CREATE TABLE `notification_pending_group_action` (
  `notification_id` varchar(36) NOT NULL,
  `pending_group_id` varchar(36) NOT NULL,
  `approve_url` text NOT NULL,
  `reject_url` text NOT NULL,
  `status` enum('pending','approved','rejected') NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notification_pending_group_action`
--

INSERT INTO `notification_pending_group_action` (`notification_id`, `pending_group_id`, `approve_url`, `reject_url`, `status`, `created_at`) VALUES
('0fa60b6e-3cfe-4999-a9a7-432dbce58f5a', 'feba1a82-ab69-4b52-b6bb-61b5572a6a74', 'https://hulda-unglutted-curably.ngrok-free.dev/api/group/pending/email-action?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6InBlbmRpbmdfZ3JvdXBfYWN0aW9uIiwicGVuZGluZ0dyb3VwSWQiOiJmZWJhMWE4Mi1hYjY5LTRiNTItYjZiYi02MWI1NTcyYTZhNzQiLCJyZXZpZXdlcklkIjoiY2FlMDlkMDUtN2EyNS00NzE0LWJkMzMtMjQxMDMxOWY5Y2MzIiwiYWN0aW9uIjoiYXBwcm92ZSIsImlhdCI6MTc3NzgyOTY3OSwiZXhwIjoxNzc4NDM0NDc5fQ.D1sFJZSto-5_DzxsojsPmMOdAOGM7HKcERYdI60EILQ', 'https://hulda-unglutted-curably.ngrok-free.dev/api/group/pending/email-action?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6InBlbmRpbmdfZ3JvdXBfYWN0aW9uIiwicGVuZGluZ0dyb3VwSWQiOiJmZWJhMWE4Mi1hYjY5LTRiNTItYjZiYi02MWI1NTcyYTZhNzQiLCJyZXZpZXdlcklkIjoiY2FlMDlkMDUtN2EyNS00NzE0LWJkMzMtMjQxMDMxOWY5Y2MzIiwiYWN0aW9uIjoicmVqZWN0IiwiaWF0IjoxNzc3ODI5Njc5LCJleHAiOjE3Nzg0MzQ0Nzl9.7w4WaLMz1yY-7Sxtltwb_jRW9hQ1W5t42VBHftkuCbY', 'pending', '2026-05-03 17:34:41'),
('103428ce-1dd4-40f4-90fc-36c5b06f0210', '27249068-acf9-4839-8339-f61ac48e5629', 'http://localhost:4000/api/group/pending/email-action?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6InBlbmRpbmdfZ3JvdXBfYWN0aW9uIiwicGVuZGluZ0dyb3VwSWQiOiIyNzI0OTA2OC1hY2Y5LTQ4MzktODMzOS1mNjFhYzQ4ZTU2MjkiLCJyZXZpZXdlcklkIjoiMDI2NGE4NGQtZDczNS00ZTRhLTk2N2ItYmE2N2VlZDA1YzU4IiwiYWN0aW9uIjoiYXBwcm92ZSIsImlhdCI6MTc3NzgyODAyNywiZXhwIjoxNzc4NDMyODI3fQ.1cebZl1LDtFhNURTDAC_dFKaUInLv-RIvJzM8qrcQ9c', 'http://localhost:4000/api/group/pending/email-action?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6InBlbmRpbmdfZ3JvdXBfYWN0aW9uIiwicGVuZGluZ0dyb3VwSWQiOiIyNzI0OTA2OC1hY2Y5LTQ4MzktODMzOS1mNjFhYzQ4ZTU2MjkiLCJyZXZpZXdlcklkIjoiMDI2NGE4NGQtZDczNS00ZTRhLTk2N2ItYmE2N2VlZDA1YzU4IiwiYWN0aW9uIjoicmVqZWN0IiwiaWF0IjoxNzc3ODI4MDI3LCJleHAiOjE3Nzg0MzI4Mjd9.lbF3hIBTtiTLcFDqbHVijl1bq8_I_p-UzMj8dJn9ycw', 'approved', '2026-05-03 17:07:07'),
('1bab737c-c752-495a-ad53-072e0f9a46bd', 'bdcb495d-d64e-42c8-8699-97c1938b2c9e', 'https://hulda-unglutted-curably.ngrok-free.dev/api/group/pending/email-action?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6InBlbmRpbmdfZ3JvdXBfYWN0aW9uIiwicGVuZGluZ0dyb3VwSWQiOiJiZGNiNDk1ZC1kNjRlLTQyYzgtODY5OS05N2MxOTM4YjJjOWUiLCJyZXZpZXdlcklkIjoiMDI2NGE4NGQtZDczNS00ZTRhLTk2N2ItYmE2N2VlZDA1YzU4IiwiYWN0aW9uIjoiYXBwcm92ZSIsImlhdCI6MTc3NzgyOTY4MywiZXhwIjoxNzc4NDM0NDgzfQ.w_e9DHZRml31LdMMCi5QO4tEEAGPbgt1rvcqcoSg8uw', 'https://hulda-unglutted-curably.ngrok-free.dev/api/group/pending/email-action?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6InBlbmRpbmdfZ3JvdXBfYWN0aW9uIiwicGVuZGluZ0dyb3VwSWQiOiJiZGNiNDk1ZC1kNjRlLTQyYzgtODY5OS05N2MxOTM4YjJjOWUiLCJyZXZpZXdlcklkIjoiMDI2NGE4NGQtZDczNS00ZTRhLTk2N2ItYmE2N2VlZDA1YzU4IiwiYWN0aW9uIjoicmVqZWN0IiwiaWF0IjoxNzc3ODI5NjgzLCJleHAiOjE3Nzg0MzQ0ODN9.LfhfTAPqzme913RgJcfm0v6w2P5jzeBy6W-Nny7XxmU', 'pending', '2026-05-03 17:34:45'),
('212bbae3-82e1-4fbf-a128-c5c977dd63f2', 'feba1a82-ab69-4b52-b6bb-61b5572a6a74', 'https://hulda-unglutted-curably.ngrok-free.dev/api/group/pending/email-action?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6InBlbmRpbmdfZ3JvdXBfYWN0aW9uIiwicGVuZGluZ0dyb3VwSWQiOiJmZWJhMWE4Mi1hYjY5LTRiNTItYjZiYi02MWI1NTcyYTZhNzQiLCJyZXZpZXdlcklkIjoiOWE1YmVjZGYtMjJiZC00N2RlLTg1YzktZjBlNjYwNjNlMzc5IiwiYWN0aW9uIjoiYXBwcm92ZSIsImlhdCI6MTc3NzgyOTY3OSwiZXhwIjoxNzc4NDM0NDc5fQ.qWhDIjumKH8pPE_rk2pSQA3IaXXN7jKD3J0zALjIEic', 'https://hulda-unglutted-curably.ngrok-free.dev/api/group/pending/email-action?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6InBlbmRpbmdfZ3JvdXBfYWN0aW9uIiwicGVuZGluZ0dyb3VwSWQiOiJmZWJhMWE4Mi1hYjY5LTRiNTItYjZiYi02MWI1NTcyYTZhNzQiLCJyZXZpZXdlcklkIjoiOWE1YmVjZGYtMjJiZC00N2RlLTg1YzktZjBlNjYwNjNlMzc5IiwiYWN0aW9uIjoicmVqZWN0IiwiaWF0IjoxNzc3ODI5Njc5LCJleHAiOjE3Nzg0MzQ0Nzl9.vqxU4cMzDEnuCOPhEAlVcsO9vAJOljUCbM8UACR1YYQ', 'pending', '2026-05-03 17:34:41'),
('2854e0a2-e751-40cc-b1ff-fb067f9fff5d', '60a7ecb9-c5d5-4b89-9ed9-9fbfd837b266', 'https://hulda-unglutted-curably.ngrok-free.dev/api/group/pending/email-action?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6InBlbmRpbmdfZ3JvdXBfYWN0aW9uIiwicGVuZGluZ0dyb3VwSWQiOiI2MGE3ZWNiOS1jNWQ1LTRiODktOWVkOS05ZmJmZDgzN2IyNjYiLCJyZXZpZXdlcklkIjoiMDI2NGE4NGQtZDczNS00ZTRhLTk2N2ItYmE2N2VlZDA1YzU4IiwiYWN0aW9uIjoiYXBwcm92ZSIsImlhdCI6MTc3NzgyOTY4OCwiZXhwIjoxNzc4NDM0NDg4fQ.-EHsJde3iNiy9Norg0sQjtqF2pskJEzp01_K_c4y2pY', 'https://hulda-unglutted-curably.ngrok-free.dev/api/group/pending/email-action?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6InBlbmRpbmdfZ3JvdXBfYWN0aW9uIiwicGVuZGluZ0dyb3VwSWQiOiI2MGE3ZWNiOS1jNWQ1LTRiODktOWVkOS05ZmJmZDgzN2IyNjYiLCJyZXZpZXdlcklkIjoiMDI2NGE4NGQtZDczNS00ZTRhLTk2N2ItYmE2N2VlZDA1YzU4IiwiYWN0aW9uIjoicmVqZWN0IiwiaWF0IjoxNzc3ODI5Njg4LCJleHAiOjE3Nzg0MzQ0ODh9.97GhQm2zMqpbxMKQqB59q-sqBc24IsX7WnZ8nyWZZfU', 'approved', '2026-05-03 17:34:50'),
('2876fc9e-1c98-40ea-b8c5-7174d8a5187b', 'bdcb495d-d64e-42c8-8699-97c1938b2c9e', 'https://hulda-unglutted-curably.ngrok-free.dev/api/group/pending/email-action?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6InBlbmRpbmdfZ3JvdXBfYWN0aW9uIiwicGVuZGluZ0dyb3VwSWQiOiJiZGNiNDk1ZC1kNjRlLTQyYzgtODY5OS05N2MxOTM4YjJjOWUiLCJyZXZpZXdlcklkIjoiOWE1YmVjZGYtMjJiZC00N2RlLTg1YzktZjBlNjYwNjNlMzc5IiwiYWN0aW9uIjoiYXBwcm92ZSIsImlhdCI6MTc3NzgyOTY4MywiZXhwIjoxNzc4NDM0NDgzfQ.jjhh-IFkrGpOxZYWUFBj3Ay9RsFYC16FeC2N2Aysf4Y', 'https://hulda-unglutted-curably.ngrok-free.dev/api/group/pending/email-action?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6InBlbmRpbmdfZ3JvdXBfYWN0aW9uIiwicGVuZGluZ0dyb3VwSWQiOiJiZGNiNDk1ZC1kNjRlLTQyYzgtODY5OS05N2MxOTM4YjJjOWUiLCJyZXZpZXdlcklkIjoiOWE1YmVjZGYtMjJiZC00N2RlLTg1YzktZjBlNjYwNjNlMzc5IiwiYWN0aW9uIjoicmVqZWN0IiwiaWF0IjoxNzc3ODI5NjgzLCJleHAiOjE3Nzg0MzQ0ODN9.KYII-ZMclAaURPeL6Z7rrzI2gSwef44k5DiOHWhBewg', 'pending', '2026-05-03 17:34:44'),
('2a224e7a-4286-42e5-ad1b-57a731dd9003', '60a7ecb9-c5d5-4b89-9ed9-9fbfd837b266', 'https://hulda-unglutted-curably.ngrok-free.dev/api/group/pending/email-action?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6InBlbmRpbmdfZ3JvdXBfYWN0aW9uIiwicGVuZGluZ0dyb3VwSWQiOiI2MGE3ZWNiOS1jNWQ1LTRiODktOWVkOS05ZmJmZDgzN2IyNjYiLCJyZXZpZXdlcklkIjoiY2FlMDlkMDUtN2EyNS00NzE0LWJkMzMtMjQxMDMxOWY5Y2MzIiwiYWN0aW9uIjoiYXBwcm92ZSIsImlhdCI6MTc3NzgyOTY4OCwiZXhwIjoxNzc4NDM0NDg4fQ.UvpCBoMoymOe9d4ewctrbx_vlUpF4r-EGNGBiXYNuNk', 'https://hulda-unglutted-curably.ngrok-free.dev/api/group/pending/email-action?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6InBlbmRpbmdfZ3JvdXBfYWN0aW9uIiwicGVuZGluZ0dyb3VwSWQiOiI2MGE3ZWNiOS1jNWQ1LTRiODktOWVkOS05ZmJmZDgzN2IyNjYiLCJyZXZpZXdlcklkIjoiY2FlMDlkMDUtN2EyNS00NzE0LWJkMzMtMjQxMDMxOWY5Y2MzIiwiYWN0aW9uIjoicmVqZWN0IiwiaWF0IjoxNzc3ODI5Njg4LCJleHAiOjE3Nzg0MzQ0ODh9.zs8QRrMbKbKeFicBO9Nf74KaFheVvWco0IEZ40AxbuE', 'approved', '2026-05-03 17:34:50'),
('4011102a-4f1b-46ce-bacf-2716a5a40b5e', 'feba1a82-ab69-4b52-b6bb-61b5572a6a74', 'https://hulda-unglutted-curably.ngrok-free.dev/api/group/pending/email-action?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6InBlbmRpbmdfZ3JvdXBfYWN0aW9uIiwicGVuZGluZ0dyb3VwSWQiOiJmZWJhMWE4Mi1hYjY5LTRiNTItYjZiYi02MWI1NTcyYTZhNzQiLCJyZXZpZXdlcklkIjoiMDI2NGE4NGQtZDczNS00ZTRhLTk2N2ItYmE2N2VlZDA1YzU4IiwiYWN0aW9uIjoiYXBwcm92ZSIsImlhdCI6MTc3NzgyOTY3OSwiZXhwIjoxNzc4NDM0NDc5fQ.XIWgq_1EfMo7TUdN44rXejMiIBW5c67ii7sFkptvZV8', 'https://hulda-unglutted-curably.ngrok-free.dev/api/group/pending/email-action?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6InBlbmRpbmdfZ3JvdXBfYWN0aW9uIiwicGVuZGluZ0dyb3VwSWQiOiJmZWJhMWE4Mi1hYjY5LTRiNTItYjZiYi02MWI1NTcyYTZhNzQiLCJyZXZpZXdlcklkIjoiMDI2NGE4NGQtZDczNS00ZTRhLTk2N2ItYmE2N2VlZDA1YzU4IiwiYWN0aW9uIjoicmVqZWN0IiwiaWF0IjoxNzc3ODI5Njc5LCJleHAiOjE3Nzg0MzQ0Nzl9.KJSMSM4SgzEEJoi7LFMfXz0FGGayv3d9y0ZtIYW7ctg', 'pending', '2026-05-03 17:34:41'),
('433ff245-e4eb-48e9-93d4-4b24f9e91364', '4443697f-180a-4860-8553-4472af6d514e', 'https://hulda-unglutted-curably.ngrok-free.dev/api/group/pending/email-action?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6InBlbmRpbmdfZ3JvdXBfYWN0aW9uIiwicGVuZGluZ0dyb3VwSWQiOiI0NDQzNjk3Zi0xODBhLTQ4NjAtODU1My00NDcyYWY2ZDUxNGUiLCJyZXZpZXdlcklkIjoiY2FlMDlkMDUtN2EyNS00NzE0LWJkMzMtMjQxMDMxOWY5Y2MzIiwiYWN0aW9uIjoiYXBwcm92ZSIsImlhdCI6MTc3NzgyOTY4NywiZXhwIjoxNzc4NDM0NDg3fQ.bXU99MkoeYdPaI5rjp7QiPfNO3bJBcV1jd8LvAf6Q0I', 'https://hulda-unglutted-curably.ngrok-free.dev/api/group/pending/email-action?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6InBlbmRpbmdfZ3JvdXBfYWN0aW9uIiwicGVuZGluZ0dyb3VwSWQiOiI0NDQzNjk3Zi0xODBhLTQ4NjAtODU1My00NDcyYWY2ZDUxNGUiLCJyZXZpZXdlcklkIjoiY2FlMDlkMDUtN2EyNS00NzE0LWJkMzMtMjQxMDMxOWY5Y2MzIiwiYWN0aW9uIjoicmVqZWN0IiwiaWF0IjoxNzc3ODI5Njg3LCJleHAiOjE3Nzg0MzQ0ODd9.n5tBqqCZmQ8rxScybn50N6M1jmsj7hYcAM5XcygbSzo', 'pending', '2026-05-03 17:34:49'),
('4ef0d36b-bd9d-4f37-9798-76ff89e67ef1', '5651caed-fa1d-44ca-a639-782a1c428c2f', 'https://hulda-unglutted-curably.ngrok-free.dev/api/group/pending/email-action?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6InBlbmRpbmdfZ3JvdXBfYWN0aW9uIiwicGVuZGluZ0dyb3VwSWQiOiI1NjUxY2FlZC1mYTFkLTQ0Y2EtYTYzOS03ODJhMWM0MjhjMmYiLCJyZXZpZXdlcklkIjoiY2FlMDlkMDUtN2EyNS00NzE0LWJkMzMtMjQxMDMxOWY5Y2MzIiwiYWN0aW9uIjoiYXBwcm92ZSIsImlhdCI6MTc3NzgyOTY3NywiZXhwIjoxNzc4NDM0NDc3fQ.br7Ljzug-9xXUE0Ynm09cOoz-GlOVqfKU-ZfgrzgglY', 'https://hulda-unglutted-curably.ngrok-free.dev/api/group/pending/email-action?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6InBlbmRpbmdfZ3JvdXBfYWN0aW9uIiwicGVuZGluZ0dyb3VwSWQiOiI1NjUxY2FlZC1mYTFkLTQ0Y2EtYTYzOS03ODJhMWM0MjhjMmYiLCJyZXZpZXdlcklkIjoiY2FlMDlkMDUtN2EyNS00NzE0LWJkMzMtMjQxMDMxOWY5Y2MzIiwiYWN0aW9uIjoicmVqZWN0IiwiaWF0IjoxNzc3ODI5Njc3LCJleHAiOjE3Nzg0MzQ0Nzd9.7NS1jErhOCA9d7SclMPK0V83g9NBQ-nuUINWOZM2MF4', 'pending', '2026-05-03 17:34:39'),
('5717a15b-0a40-436d-9456-9e62bd6212f1', '27249068-acf9-4839-8339-f61ac48e5629', 'http://localhost:4000/api/group/pending/email-action?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6InBlbmRpbmdfZ3JvdXBfYWN0aW9uIiwicGVuZGluZ0dyb3VwSWQiOiIyNzI0OTA2OC1hY2Y5LTQ4MzktODMzOS1mNjFhYzQ4ZTU2MjkiLCJyZXZpZXdlcklkIjoiOWE1YmVjZGYtMjJiZC00N2RlLTg1YzktZjBlNjYwNjNlMzc5IiwiYWN0aW9uIjoiYXBwcm92ZSIsImlhdCI6MTc3NzgyODAyNywiZXhwIjoxNzc4NDMyODI3fQ.A56P9qCLsDLeBCsuRLA0b1HCIFQEHfaNhETZbN8FqOE', 'http://localhost:4000/api/group/pending/email-action?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6InBlbmRpbmdfZ3JvdXBfYWN0aW9uIiwicGVuZGluZ0dyb3VwSWQiOiIyNzI0OTA2OC1hY2Y5LTQ4MzktODMzOS1mNjFhYzQ4ZTU2MjkiLCJyZXZpZXdlcklkIjoiOWE1YmVjZGYtMjJiZC00N2RlLTg1YzktZjBlNjYwNjNlMzc5IiwiYWN0aW9uIjoicmVqZWN0IiwiaWF0IjoxNzc3ODI4MDI3LCJleHAiOjE3Nzg0MzI4Mjd9.lyLL5u_iKWPQPGqPEqSxy5Nm1F81kjPHf7CoxZLQphM', 'approved', '2026-05-03 17:07:07'),
('74e78fc5-6cdb-4677-a831-bda36fb5cd71', '5651caed-fa1d-44ca-a639-782a1c428c2f', 'https://hulda-unglutted-curably.ngrok-free.dev/api/group/pending/email-action?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6InBlbmRpbmdfZ3JvdXBfYWN0aW9uIiwicGVuZGluZ0dyb3VwSWQiOiI1NjUxY2FlZC1mYTFkLTQ0Y2EtYTYzOS03ODJhMWM0MjhjMmYiLCJyZXZpZXdlcklkIjoiMDI2NGE4NGQtZDczNS00ZTRhLTk2N2ItYmE2N2VlZDA1YzU4IiwiYWN0aW9uIjoiYXBwcm92ZSIsImlhdCI6MTc3NzgyOTY3NywiZXhwIjoxNzc4NDM0NDc3fQ.lpznvi253e4BRCQvj7uF7qgtx4ZlRF3Q4C0SKZ6SSzA', 'https://hulda-unglutted-curably.ngrok-free.dev/api/group/pending/email-action?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6InBlbmRpbmdfZ3JvdXBfYWN0aW9uIiwicGVuZGluZ0dyb3VwSWQiOiI1NjUxY2FlZC1mYTFkLTQ0Y2EtYTYzOS03ODJhMWM0MjhjMmYiLCJyZXZpZXdlcklkIjoiMDI2NGE4NGQtZDczNS00ZTRhLTk2N2ItYmE2N2VlZDA1YzU4IiwiYWN0aW9uIjoicmVqZWN0IiwiaWF0IjoxNzc3ODI5Njc3LCJleHAiOjE3Nzg0MzQ0Nzd9.FY7i4q9hU6B4lRWVkCiceCdNC9TE0d8ASzMksZbSpNc', 'pending', '2026-05-03 17:34:39'),
('a545c897-22fd-41be-b9a8-9124882f1272', '5d2ed02f-49d2-43d2-b71a-f98e070874cf', 'https://hulda-unglutted-curably.ngrok-free.dev/api/group/pending/email-action?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6InBlbmRpbmdfZ3JvdXBfYWN0aW9uIiwicGVuZGluZ0dyb3VwSWQiOiI1ZDJlZDAyZi00OWQyLTQzZDItYjcxYS1mOThlMDcwODc0Y2YiLCJyZXZpZXdlcklkIjoiMDI2NGE4NGQtZDczNS00ZTRhLTk2N2ItYmE2N2VlZDA1YzU4IiwiYWN0aW9uIjoiYXBwcm92ZSIsImlhdCI6MTc3NzgyOTY4NCwiZXhwIjoxNzc4NDM0NDg0fQ.hLhCc8ictRRkRiMXG7DeMHLf2pWasd3oYWfAXbjwqxw', 'https://hulda-unglutted-curably.ngrok-free.dev/api/group/pending/email-action?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6InBlbmRpbmdfZ3JvdXBfYWN0aW9uIiwicGVuZGluZ0dyb3VwSWQiOiI1ZDJlZDAyZi00OWQyLTQzZDItYjcxYS1mOThlMDcwODc0Y2YiLCJyZXZpZXdlcklkIjoiMDI2NGE4NGQtZDczNS00ZTRhLTk2N2ItYmE2N2VlZDA1YzU4IiwiYWN0aW9uIjoicmVqZWN0IiwiaWF0IjoxNzc3ODI5Njg0LCJleHAiOjE3Nzg0MzQ0ODR9.zN3F7ux0iNXi0b4zSl-HKAUw0qpUpUn_Pvgx9XqJZ1E', 'pending', '2026-05-03 17:34:46'),
('a57f41a2-56cc-4fcd-8588-d0663e5ec1d6', '4443697f-180a-4860-8553-4472af6d514e', 'https://hulda-unglutted-curably.ngrok-free.dev/api/group/pending/email-action?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6InBlbmRpbmdfZ3JvdXBfYWN0aW9uIiwicGVuZGluZ0dyb3VwSWQiOiI0NDQzNjk3Zi0xODBhLTQ4NjAtODU1My00NDcyYWY2ZDUxNGUiLCJyZXZpZXdlcklkIjoiMDI2NGE4NGQtZDczNS00ZTRhLTk2N2ItYmE2N2VlZDA1YzU4IiwiYWN0aW9uIjoiYXBwcm92ZSIsImlhdCI6MTc3NzgyOTY4NywiZXhwIjoxNzc4NDM0NDg3fQ.zJDSDgpS1FmwsZP_tSkTMdb1j5mf8Ed5woOPQr6klmA', 'https://hulda-unglutted-curably.ngrok-free.dev/api/group/pending/email-action?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6InBlbmRpbmdfZ3JvdXBfYWN0aW9uIiwicGVuZGluZ0dyb3VwSWQiOiI0NDQzNjk3Zi0xODBhLTQ4NjAtODU1My00NDcyYWY2ZDUxNGUiLCJyZXZpZXdlcklkIjoiMDI2NGE4NGQtZDczNS00ZTRhLTk2N2ItYmE2N2VlZDA1YzU4IiwiYWN0aW9uIjoicmVqZWN0IiwiaWF0IjoxNzc3ODI5Njg3LCJleHAiOjE3Nzg0MzQ0ODd9.VBHkXjhxizmTniSWbaq4ghgquu6hWcOuzjbK72DEgao', 'pending', '2026-05-03 17:34:49'),
('bafa91ce-3ac3-49b2-90ba-a2e6725dc404', '5d2ed02f-49d2-43d2-b71a-f98e070874cf', 'https://hulda-unglutted-curably.ngrok-free.dev/api/group/pending/email-action?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6InBlbmRpbmdfZ3JvdXBfYWN0aW9uIiwicGVuZGluZ0dyb3VwSWQiOiI1ZDJlZDAyZi00OWQyLTQzZDItYjcxYS1mOThlMDcwODc0Y2YiLCJyZXZpZXdlcklkIjoiY2FlMDlkMDUtN2EyNS00NzE0LWJkMzMtMjQxMDMxOWY5Y2MzIiwiYWN0aW9uIjoiYXBwcm92ZSIsImlhdCI6MTc3NzgyOTY4NCwiZXhwIjoxNzc4NDM0NDg0fQ.FmkI0TlHOq7O6feDXrAtEhZVZBFmkARTJzoyybKBfFw', 'https://hulda-unglutted-curably.ngrok-free.dev/api/group/pending/email-action?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6InBlbmRpbmdfZ3JvdXBfYWN0aW9uIiwicGVuZGluZ0dyb3VwSWQiOiI1ZDJlZDAyZi00OWQyLTQzZDItYjcxYS1mOThlMDcwODc0Y2YiLCJyZXZpZXdlcklkIjoiY2FlMDlkMDUtN2EyNS00NzE0LWJkMzMtMjQxMDMxOWY5Y2MzIiwiYWN0aW9uIjoicmVqZWN0IiwiaWF0IjoxNzc3ODI5Njg0LCJleHAiOjE3Nzg0MzQ0ODR9.L2xmW-X8AHyL7RvEARhzZsv1gnTSp24uTtBvzCpeZ4I', 'pending', '2026-05-03 17:34:46'),
('c088b387-f7b9-4ce9-a0f5-eb3203f4d534', '60a7ecb9-c5d5-4b89-9ed9-9fbfd837b266', 'https://hulda-unglutted-curably.ngrok-free.dev/api/group/pending/email-action?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6InBlbmRpbmdfZ3JvdXBfYWN0aW9uIiwicGVuZGluZ0dyb3VwSWQiOiI2MGE3ZWNiOS1jNWQ1LTRiODktOWVkOS05ZmJmZDgzN2IyNjYiLCJyZXZpZXdlcklkIjoiOWE1YmVjZGYtMjJiZC00N2RlLTg1YzktZjBlNjYwNjNlMzc5IiwiYWN0aW9uIjoiYXBwcm92ZSIsImlhdCI6MTc3NzgyOTY4OCwiZXhwIjoxNzc4NDM0NDg4fQ.7MfT2SbrCp7a_2uZkAR9u1FVr9NxkG1m3WSf4g6wZuM', 'https://hulda-unglutted-curably.ngrok-free.dev/api/group/pending/email-action?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6InBlbmRpbmdfZ3JvdXBfYWN0aW9uIiwicGVuZGluZ0dyb3VwSWQiOiI2MGE3ZWNiOS1jNWQ1LTRiODktOWVkOS05ZmJmZDgzN2IyNjYiLCJyZXZpZXdlcklkIjoiOWE1YmVjZGYtMjJiZC00N2RlLTg1YzktZjBlNjYwNjNlMzc5IiwiYWN0aW9uIjoicmVqZWN0IiwiaWF0IjoxNzc3ODI5Njg4LCJleHAiOjE3Nzg0MzQ0ODh9.prudLm04x4ySOfxiAVO61GFnsOYI1nBsWM_U3EnGtPA', 'approved', '2026-05-03 17:34:49'),
('c1a8eccc-52ac-4742-9927-a7fdd67adf9b', '5651caed-fa1d-44ca-a639-782a1c428c2f', 'https://hulda-unglutted-curably.ngrok-free.dev/api/group/pending/email-action?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6InBlbmRpbmdfZ3JvdXBfYWN0aW9uIiwicGVuZGluZ0dyb3VwSWQiOiI1NjUxY2FlZC1mYTFkLTQ0Y2EtYTYzOS03ODJhMWM0MjhjMmYiLCJyZXZpZXdlcklkIjoiOWE1YmVjZGYtMjJiZC00N2RlLTg1YzktZjBlNjYwNjNlMzc5IiwiYWN0aW9uIjoiYXBwcm92ZSIsImlhdCI6MTc3NzgyOTY3NywiZXhwIjoxNzc4NDM0NDc3fQ.c9JQV3X7gvgYHxzbFy9ihS_15ILkytDnbfUGUg6jiN4', 'https://hulda-unglutted-curably.ngrok-free.dev/api/group/pending/email-action?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6InBlbmRpbmdfZ3JvdXBfYWN0aW9uIiwicGVuZGluZ0dyb3VwSWQiOiI1NjUxY2FlZC1mYTFkLTQ0Y2EtYTYzOS03ODJhMWM0MjhjMmYiLCJyZXZpZXdlcklkIjoiOWE1YmVjZGYtMjJiZC00N2RlLTg1YzktZjBlNjYwNjNlMzc5IiwiYWN0aW9uIjoicmVqZWN0IiwiaWF0IjoxNzc3ODI5Njc3LCJleHAiOjE3Nzg0MzQ0Nzd9.3pI4RRn5uNn46BMMDZLXNhT7Mn4aeZU5wyFYSKU91qU', 'pending', '2026-05-03 17:34:39'),
('c963226a-9106-43de-8880-64994a7b2627', '27249068-acf9-4839-8339-f61ac48e5629', 'http://localhost:4000/api/group/pending/email-action?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6InBlbmRpbmdfZ3JvdXBfYWN0aW9uIiwicGVuZGluZ0dyb3VwSWQiOiIyNzI0OTA2OC1hY2Y5LTQ4MzktODMzOS1mNjFhYzQ4ZTU2MjkiLCJyZXZpZXdlcklkIjoiY2FlMDlkMDUtN2EyNS00NzE0LWJkMzMtMjQxMDMxOWY5Y2MzIiwiYWN0aW9uIjoiYXBwcm92ZSIsImlhdCI6MTc3NzgyODAyNywiZXhwIjoxNzc4NDMyODI3fQ.wTEFvSSB4CpsY6pEA8fEqnH0HE7qlBqb4OorRO3QGRk', 'http://localhost:4000/api/group/pending/email-action?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6InBlbmRpbmdfZ3JvdXBfYWN0aW9uIiwicGVuZGluZ0dyb3VwSWQiOiIyNzI0OTA2OC1hY2Y5LTQ4MzktODMzOS1mNjFhYzQ4ZTU2MjkiLCJyZXZpZXdlcklkIjoiY2FlMDlkMDUtN2EyNS00NzE0LWJkMzMtMjQxMDMxOWY5Y2MzIiwiYWN0aW9uIjoicmVqZWN0IiwiaWF0IjoxNzc3ODI4MDI3LCJleHAiOjE3Nzg0MzI4Mjd9.AQuv2pAL3433qjeZ_LOm0HX_GAU2lOOFMX9-8CNOYEI', 'approved', '2026-05-03 17:07:07'),
('d0e3297b-22ec-49b6-8efb-b07abd91bf4b', 'bdcb495d-d64e-42c8-8699-97c1938b2c9e', 'https://hulda-unglutted-curably.ngrok-free.dev/api/group/pending/email-action?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6InBlbmRpbmdfZ3JvdXBfYWN0aW9uIiwicGVuZGluZ0dyb3VwSWQiOiJiZGNiNDk1ZC1kNjRlLTQyYzgtODY5OS05N2MxOTM4YjJjOWUiLCJyZXZpZXdlcklkIjoiY2FlMDlkMDUtN2EyNS00NzE0LWJkMzMtMjQxMDMxOWY5Y2MzIiwiYWN0aW9uIjoiYXBwcm92ZSIsImlhdCI6MTc3NzgyOTY4MywiZXhwIjoxNzc4NDM0NDgzfQ.kjZSB4cdFU2i92I-8wOALAs-k3DcbyvOIi1U0311xUI', 'https://hulda-unglutted-curably.ngrok-free.dev/api/group/pending/email-action?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6InBlbmRpbmdfZ3JvdXBfYWN0aW9uIiwicGVuZGluZ0dyb3VwSWQiOiJiZGNiNDk1ZC1kNjRlLTQyYzgtODY5OS05N2MxOTM4YjJjOWUiLCJyZXZpZXdlcklkIjoiY2FlMDlkMDUtN2EyNS00NzE0LWJkMzMtMjQxMDMxOWY5Y2MzIiwiYWN0aW9uIjoicmVqZWN0IiwiaWF0IjoxNzc3ODI5NjgzLCJleHAiOjE3Nzg0MzQ0ODN9.whtvBdR-b1WpVUGuMXW2jd_7NsfSPSIGdgZnoQCpTQ0', 'pending', '2026-05-03 17:34:44'),
('e294f78b-7d72-4a48-b98e-8f842620861c', '4443697f-180a-4860-8553-4472af6d514e', 'https://hulda-unglutted-curably.ngrok-free.dev/api/group/pending/email-action?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6InBlbmRpbmdfZ3JvdXBfYWN0aW9uIiwicGVuZGluZ0dyb3VwSWQiOiI0NDQzNjk3Zi0xODBhLTQ4NjAtODU1My00NDcyYWY2ZDUxNGUiLCJyZXZpZXdlcklkIjoiOWE1YmVjZGYtMjJiZC00N2RlLTg1YzktZjBlNjYwNjNlMzc5IiwiYWN0aW9uIjoiYXBwcm92ZSIsImlhdCI6MTc3NzgyOTY4NywiZXhwIjoxNzc4NDM0NDg3fQ.Ohe-dOncRTKlNiFwuvyfhagTLXqnzOuEFsYIZWDlirc', 'https://hulda-unglutted-curably.ngrok-free.dev/api/group/pending/email-action?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6InBlbmRpbmdfZ3JvdXBfYWN0aW9uIiwicGVuZGluZ0dyb3VwSWQiOiI0NDQzNjk3Zi0xODBhLTQ4NjAtODU1My00NDcyYWY2ZDUxNGUiLCJyZXZpZXdlcklkIjoiOWE1YmVjZGYtMjJiZC00N2RlLTg1YzktZjBlNjYwNjNlMzc5IiwiYWN0aW9uIjoicmVqZWN0IiwiaWF0IjoxNzc3ODI5Njg3LCJleHAiOjE3Nzg0MzQ0ODd9.Sn0HpPu5LwSfUQqAQA0lKhyurljeSwamIy8krH7tN74', 'pending', '2026-05-03 17:34:49'),
('e4cb9c88-37c2-4a2e-823f-0b0b0af5c76b', '5d2ed02f-49d2-43d2-b71a-f98e070874cf', 'https://hulda-unglutted-curably.ngrok-free.dev/api/group/pending/email-action?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6InBlbmRpbmdfZ3JvdXBfYWN0aW9uIiwicGVuZGluZ0dyb3VwSWQiOiI1ZDJlZDAyZi00OWQyLTQzZDItYjcxYS1mOThlMDcwODc0Y2YiLCJyZXZpZXdlcklkIjoiOWE1YmVjZGYtMjJiZC00N2RlLTg1YzktZjBlNjYwNjNlMzc5IiwiYWN0aW9uIjoiYXBwcm92ZSIsImlhdCI6MTc3NzgyOTY4NCwiZXhwIjoxNzc4NDM0NDg0fQ.6RoompUx7RLbPVag2RZBoRkileBePDTkLqdZBEm8jUc', 'https://hulda-unglutted-curably.ngrok-free.dev/api/group/pending/email-action?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6InBlbmRpbmdfZ3JvdXBfYWN0aW9uIiwicGVuZGluZ0dyb3VwSWQiOiI1ZDJlZDAyZi00OWQyLTQzZDItYjcxYS1mOThlMDcwODc0Y2YiLCJyZXZpZXdlcklkIjoiOWE1YmVjZGYtMjJiZC00N2RlLTg1YzktZjBlNjYwNjNlMzc5IiwiYWN0aW9uIjoicmVqZWN0IiwiaWF0IjoxNzc3ODI5Njg0LCJleHAiOjE3Nzg0MzQ0ODR9.gkZe5Wig_JvFGeAhrQSW3uHXXChnYANobOzr0zmr-QU', 'pending', '2026-05-03 17:34:46');

-- --------------------------------------------------------

--
-- Table structure for table `organization_domain`
--

CREATE TABLE `organization_domain` (
  `id` varchar(36) NOT NULL,
  `domain_name` varchar(255) NOT NULL,
  `company_id` varchar(36) NOT NULL DEFAULT 'google.com',
  `auth_email_enabled` tinyint(1) DEFAULT 1,
  `auth_google_enabled` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `organization_domain`
--

INSERT INTO `organization_domain` (`id`, `domain_name`, `company_id`, `auth_email_enabled`, `auth_google_enabled`, `created_at`, `updated_at`) VALUES
('2fc09d60-3fc9-4d85-a568-943ad21b9ff6', 'gmail.com', 'a0aa8222-a04e-4256-92c6-aa4d1eae55a9', 1, 1, '2026-05-04 17:40:54', '2026-05-04 17:40:54'),
('4484cb0c-02e4-4b50-b976-1b9a1d5dc3be', 'meetza.com', 'a0aa8222-a04e-4256-92c6-aa4d1eae55a9', 1, 1, '2026-05-04 17:40:54', '2026-05-04 17:40:54'),
('56011d04-1041-46c0-85e0-533b25f2a72c', 'gmail.com', 'c0633ead-44c9-408f-bcc5-dee7faa8d895', 1, 1, '2026-05-03 16:55:45', '2026-05-03 16:55:45'),
('5ae500ee-68d6-4992-b7c8-edd6c4d6cd46', 'qwizzy.com', 'b0bff1bc-3d8e-46a1-8263-575f8c981956', 1, 1, '2026-05-03 14:18:46', '2026-05-03 14:18:46'),
('66a1e386-3fe8-426b-81a5-cd51cb78b454', 'meetza.com', 'b0bff1bc-3d8e-46a1-8263-575f8c981956', 1, 1, '2026-05-04 15:23:23', '2026-05-04 15:23:23'),
('756d58c6-65b8-42ea-bba2-0d1c9630b8bc', 'gmail.com', 'dcc465f2-a289-4cc0-96a8-4da15033f42c', 1, 1, '2026-05-03 16:26:48', '2026-05-03 16:26:48'),
('88db92d3-583d-438e-933d-fa090a3b3eff', 'meetza.com', 'f0c5d845-9abe-4a37-b77a-e69b68f035b4', 1, 1, '2026-05-04 17:41:31', '2026-05-04 17:41:31'),
('ab663b24-9628-4d66-90af-7a695edff33e', 'gmail.com', 'f0c5d845-9abe-4a37-b77a-e69b68f035b4', 1, 1, '2026-05-04 17:41:31', '2026-05-04 17:41:31');

-- --------------------------------------------------------

--
-- Table structure for table `pending_groups`
--

CREATE TABLE `pending_groups` (
  `id` varchar(36) NOT NULL,
  `group_name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `group_photo` text DEFAULT NULL,
  `year` enum('1','2','3','4') NOT NULL,
  `semester` enum('Fall','Spring','Summer') NOT NULL,
  `created_by` varchar(36) NOT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `approved_by` varchar(36) DEFAULT NULL,
  `approved_at` timestamp NULL DEFAULT NULL,
  `rejected_by` varchar(36) DEFAULT NULL,
  `rejected_at` timestamp NULL DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `pending_group_admins`
--

CREATE TABLE `pending_group_admins` (
  `id` varchar(36) NOT NULL,
  `pending_group_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `role` enum('OWNER','ADMIN') NOT NULL DEFAULT 'ADMIN',
  `assigned_by` varchar(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `position`
--

CREATE TABLE `position` (
  `id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `administrator_id` varchar(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `position`
--

INSERT INTO `position` (`id`, `title`, `administrator_id`, `created_at`, `updated_at`) VALUES
('049cb124-e56f-4e40-8fa3-bed63782339c', 'Educational', '7345e640-af7d-4283-ba5d-b1a2c361ec17', '2026-05-04 17:41:32', '2026-05-04 17:41:32'),
('0b9b1919-42d1-4ba0-8a71-3b8d615da48c', 'Educational', '384b5462-110b-4081-bc67-8768e8516ad7', '2026-05-04 17:41:33', '2026-05-04 17:41:33'),
('181f870c-a53f-4468-aa1a-aab0288889a3', 'Educational', 'ae5c28ed-63d6-4c95-874f-fd2e0108fa26', '2026-05-04 17:41:34', '2026-05-04 17:41:34'),
('45df2660-6314-4fb5-847b-15f7e05fff87', 'Educational', 'e7beeaa2-4c29-4b3c-b99a-0bda253eaf3d', '2026-05-04 17:41:35', '2026-05-04 17:41:35'),
('6cfa875c-ea0c-4bba-8f6b-3e5f113b97b0', 'Educational', '72ccdd7d-f991-40c3-850b-35a944f9da41', '2026-05-04 17:41:37', '2026-05-04 17:41:37'),
('a3b6320b-1f3f-42d7-80de-8f4209c3d1a1', 'Educational', 'fbe68fee-e732-4f4f-8246-84d966fee0c4', '2026-05-04 17:41:33', '2026-05-04 17:41:33'),
('b05d6eb2-49a7-4cbb-a9a7-249dbe368b74', 'Educational', '4d6ccad9-940b-4de2-9dec-569a6edffa28', '2026-05-04 17:41:41', '2026-05-04 17:41:41'),
('bc3802da-3a62-4f05-9674-12a719024caf', 'Educational', '62007461-76d0-4d66-803c-df77ba651887', '2026-05-04 17:41:40', '2026-05-04 17:41:40');

-- --------------------------------------------------------

--
-- Table structure for table `resource_ai_metadata`
--

CREATE TABLE `resource_ai_metadata` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `resource_id` varchar(36) NOT NULL,
  `language` varchar(10) NOT NULL,
  `transcript` longtext DEFAULT NULL,
  `summary` longtext DEFAULT NULL,
  `topics` longtext DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `saved_video`
--

CREATE TABLE `saved_video` (
  `member_id` varchar(36) NOT NULL,
  `video_id` varchar(36) NOT NULL,
  `timestamp` timestamp NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `social_auth`
--

CREATE TABLE `social_auth` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `provider` varchar(50) NOT NULL,
  `provider_id` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `social_auth`
--

INSERT INTO `social_auth` (`id`, `user_id`, `provider`, `provider_id`, `created_at`, `updated_at`) VALUES
('45eeffb9-fa4a-479b-865e-57609b0a2e7f', 'fd0ab158-667b-499a-b74d-267a5e102a34', 'google', '112713307040337985541', '2026-05-03 15:32:12', '2026-05-03 15:32:12'),
('b2d52958-74f7-4fd0-ac8f-debff072c25a', '9a5becdf-22bd-47de-85c9-f0e66063e379', 'google', '108931175045897512796', '2026-05-03 15:32:28', '2026-05-03 15:32:28'),
('b730c614-3c69-4ef3-a9f6-5abb76eaf805', '698f27be-f68c-4692-84ba-49ba5fc63769', 'google', '104458933780377885852', '2026-05-03 15:31:57', '2026-05-03 15:31:57');

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('Administrator','Super_Admin','Member') NOT NULL,
  `verification_code` varchar(4) DEFAULT NULL,
  `email_verification` tinyint(1) DEFAULT 0,
  `user_photo` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `theme` enum('light','dark') DEFAULT 'light'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`id`, `name`, `email`, `password`, `role`, `verification_code`, `email_verification`, `user_photo`, `created_at`, `updated_at`, `theme`) VALUES
('0264a84d-d735-4e4a-967b-ba67eed05c58', 'Shahd Saeedd', 'shahd.saed.263@gmail.com', '$2b$10$cb0dIXntoXVkkePWS0.c5ekcb6Xc1i1tR8Z3uf5dWZPYO/lOB3r0.', 'Super_Admin', '0', 1, 'https://res.cloudinary.com/dax2irx1f/image/upload/v1771018037/posters/cjyudrzjksicwyzksozo.jpg', '2025-12-03 19:51:09', '2026-05-03 17:12:00', 'light'),
('1c197e49-aaf2-4f46-80a7-142753a98d97', 'Farida Emad', 'faridaemad7724@gmail.com', '$2b$10$gfm.qAErgrnHwnDKNE2Nl.ZUH0AQPhNfSgUo60tlIPypR/FASk4rq', 'Member', NULL, 1, 'https://res.cloudinary.com/dax2irx1f/image/upload/v1767632095/posters/y3zypqmdub6q1pryktbf.jpg', '2026-05-03 16:33:40', '2026-05-03 17:07:10', 'light'),
('35917b43-1e2b-40cd-bfa7-59de18e0330d', 'Solimaaaanoooooo', 'solimanwaleed15@gmail.com', '$2b$10$e.HHnqKw.DUqY56v2xYkLuVMEQJYLNVUpYWXSQiHFaLoLsAFgaDhC', 'Member', '0', 1, 'https://res.cloudinary.com/dax2irx1f/image/upload/v1777832749/posters/ird3ya2dx1pzqmttzsvz.jpg', '2025-12-02 19:03:53', '2026-05-04 15:42:50', 'light'),
('35e70359-89d7-456d-95cd-6b7b5e85eb59', 'Shahd saeed', '30503260105325@sci.asu.edu.eg', '$2b$10$sgitjUuWf2hhwMUXoa7MKep/h9s7ot2CwTz19HHzsMGfNHwr3xz4W', 'Member', NULL, 1, 'https://res.cloudinary.com/dax2irx1f/image/upload/v1771018037/posters/cjyudrzjksicwyzksozo.jpg', '2026-04-26 15:39:11', '2026-05-03 17:12:06', 'dark'),
('384b5462-110b-4081-bc67-8768e8516ad7', 'Azza', 'Azza@gmail.com', '$2b$10$fhKE0st57R2adPqFYi245u/S5rldZF5yaIWZRhbQv8MYsLlwWxAty', 'Administrator', NULL, 1, 'https://res.cloudinary.com/dax2irx1f/image/upload/v1767632095/posters/y3zypqmdub6q1pryktbf.jpg', '2026-05-03 16:26:50', '2026-05-03 17:07:22', 'light'),
('4d6ccad9-940b-4de2-9dec-569a6edffa28', 'Mohamed Mostafa', 'MohamedMostafa@gmail.com', '$2b$10$cDhvsKavZzdw.s9pxRb/tuskiooHIcXGVHfdFXC6rR6ExchSdOmUG', 'Administrator', NULL, 1, 'https://res.cloudinary.com/dax2irx1f/image/upload/v1767632095/posters/y3zypqmdub6q1pryktbf.jpg', '2026-05-03 16:55:52', '2026-05-04 17:31:32', 'light'),
('5c62761f-f2d5-4f1c-9af5-bc2e466f0de9', 'Aya', 'ayamohamedhelal22@gmail.com', '$2b$10$iKNPKPZXNrFikEX0g3/JF.IwUv8gFNeRl5VhTXG1JhIAnMyJjtUpG', 'Member', NULL, 1, 'https://res.cloudinary.com/dax2irx1f/image/upload/v1767632095/posters/y3zypqmdub6q1pryktbf.jpg', '2026-04-30 18:54:09', '2026-05-03 17:07:27', 'light'),
('62007461-76d0-4d66-803c-df77ba651887', 'Nashwa Abdulaziz', 'NashwaAbdulaziz@gmail.com', '$2b$10$IAMajeP/0p7Po.ZrSBJWKeiQU1ZoXFPbkYE5j2stLN5/Sj5.IP7hy', 'Administrator', NULL, 1, 'https://res.cloudinary.com/dax2irx1f/image/upload/v1767632095/posters/y3zypqmdub6q1pryktbf.jpg', '2026-05-03 16:55:51', '2026-05-03 17:07:29', 'light'),
('62d55667-2fd7-4e8c-885e-b86672512e29', 'Ayoya', 'ayahelal649@gmail.com', '$2b$10$u.SSfTMgZB6AMAWdQGkl../y3VsVOsuJ26vQgqE088C//zAOkkeg6', 'Member', NULL, 1, 'https://res.cloudinary.com/dax2irx1f/image/upload/v1772125200/posters/tpfvfioyvlsuzgdcqqvp.jpg', '2025-12-02 17:11:57', '2026-05-03 17:11:36', 'light'),
('64ffcc78-7745-424e-8dda-67e1b847d138', 'Shahoda', 'Shahoda@meetza.com', '$2b$10$7grPnpKGSTBwqw6tq/BM2e2XPtMJnDvxvfoKTokhtJdqKYCxb5Mjm', 'Administrator', NULL, 1, 'https://res.cloudinary.com/dax2irx1f/image/upload/v1771018037/posters/cjyudrzjksicwyzksozo.jpg', '2026-05-03 16:55:45', '2026-05-03 17:12:22', 'light'),
('698f27be-f68c-4692-84ba-49ba5fc63769', 'Shahd Saed', 'shahd01278039699@gmail.com', '$2b$10$vwCRyv2fZmYwI5DtikIgwOS0rmvcbfm9oavxQMVKm7Z26ZilxtC/a', 'Member', NULL, 1, 'https://res.cloudinary.com/dax2irx1f/image/upload/v1771018037/posters/cjyudrzjksicwyzksozo.jpg', '2026-01-06 11:53:20', '2026-05-03 17:12:31', 'light'),
('72ccdd7d-f991-40c3-850b-35a944f9da41', 'Ghada', 'Ghada@gmail.com', '$2b$10$W74JCiJ0znGs8nNc4YYU2eROEkp4ZsTDmFCsj.nfja7l0xey//6Da', 'Administrator', NULL, 1, 'https://res.cloudinary.com/dax2irx1f/image/upload/v1767632095/posters/y3zypqmdub6q1pryktbf.jpg', '2026-05-03 16:26:52', '2026-05-03 17:07:50', 'light'),
('7345e640-af7d-4283-ba5d-b1a2c361ec17', 'Mohamed Hashem', 'Mohamedhashim@gmail.com', '$2b$10$qxbrUM9JuGvjuwZHRElg5.TcsVyk/23j1KF7Cpy3fjEleTXj0/hnG', 'Administrator', NULL, 1, 'https://res.cloudinary.com/dax2irx1f/image/upload/v1767632095/posters/y3zypqmdub6q1pryktbf.jpg', '2026-05-03 16:26:49', '2026-05-03 17:07:53', 'light'),
('894b797d-b322-420e-b1bb-651d85df42e0', 'soliman', 'solimanelaraby743@gmail.com', '$2b$10$ndLApJNOLqpByKNCyDuLs.8bY79BarWGyGIEGwDYqe7zRSgUtQ3ce', 'Member', '5584', 0, NULL, '2026-05-06 13:06:14', '2026-05-06 13:06:14', 'light'),
('8cb755a1-8101-4df0-a9c0-b03686bbc3cf', 'Farida Emad', 'far.emad888@gmail.com', '$2b$10$rT80tgTQ13QHAF1xPLnqAeFNMlpQKUlhuBYQaEV6ih60mGxS26qMi', 'Member', NULL, 1, 'https://res.cloudinary.com/dax2irx1f/image/upload/v1767632095/posters/y3zypqmdub6q1pryktbf.jpg', '2026-04-30 18:03:56', '2026-05-05 18:22:16', 'dark'),
('9a5becdf-22bd-47de-85c9-f0e66063e379', 'Aya Mo Helal', 'aya.mo.helal@gmail.com', '$2b$10$2D27sDjDHSlABxpnbLZnAOqb/BjEkVdDX3hOK44oTlwSuQSlqr1xG', 'Super_Admin', NULL, 1, 'https://res.cloudinary.com/dax2irx1f/image/upload/v1767632095/posters/y3zypqmdub6q1pryktbf.jpg', '2025-12-02 15:37:28', '2026-05-03 17:08:08', 'light'),
('ae5c28ed-63d6-4c95-874f-fd2e0108fa26', 'Howayda', 'howayda@gmail.com', '$2b$10$BCAmdSO7ThxgwsxhVn4mledLNVQ8uhHM6Ur2AlPx0OTWDoEAuDTgK', 'Administrator', NULL, 1, 'https://res.cloudinary.com/dax2irx1f/image/upload/v1767632095/posters/y3zypqmdub6q1pryktbf.jpg', '2026-05-03 16:26:50', '2026-05-03 17:08:11', 'light'),
('cae09d05-7a25-4714-bd33-2410319f9cc3', 'Shahd Saeed', 'ShahdSaeed@meetza.com', '$2b$10$6ppdjxfsGmNQT87fjxAjNeDwuDn4m4Q/B4VdqaLDsZUM4EKLgR9n2', 'Super_Admin', NULL, 1, 'https://res.cloudinary.com/dax2irx1f/image/upload/v1771018037/posters/cjyudrzjksicwyzksozo.jpg', '2026-05-03 16:55:45', '2026-05-03 17:12:39', 'light'),
('e7beeaa2-4c29-4b3c-b99a-0bda253eaf3d', 'Dawlat Abdelaziz', 'dawlatAbdelAziz@gmail.com', '$2b$10$vHWy6xX23NOcnJKMwDqUWeyH56y85UdxYjDOx0AHRnOcQong74uQ.', 'Administrator', NULL, 1, 'https://res.cloudinary.com/dax2irx1f/image/upload/v1767632095/posters/y3zypqmdub6q1pryktbf.jpg', '2026-05-03 16:26:51', '2026-05-03 17:08:16', 'light'),
('e9f445e2-18da-4a82-8f37-24943900bb00', 'Shahd Saed', 'saeadshahd@gmail.com', '$2b$10$hjlyBKuni9t9E4QgHsbDiurPpQv6eyQp.bhOaTrY7MhtWQMQpFrwi', 'Member', NULL, 1, 'https://res.cloudinary.com/dax2irx1f/image/upload/v1771018037/posters/cjyudrzjksicwyzksozo.jpg', '2026-02-15 20:39:27', '2026-05-03 17:12:44', 'light'),
('fbe68fee-e732-4f4f-8246-84d966fee0c4', 'Hussein Karam', 'Husseinkaram@gmual.com', '$2b$10$Gzp2QGNJhc2Xd7KStciYdO5.eRDpdAFwFZtgHI966/LbkxrYhUeWO', 'Administrator', NULL, 1, 'https://res.cloudinary.com/dax2irx1f/image/upload/v1767632095/posters/y3zypqmdub6q1pryktbf.jpg', '2026-05-03 16:26:49', '2026-05-03 17:08:21', 'light'),
('fd0ab158-667b-499a-b74d-267a5e102a34', 'Aya Helal', 'aya.helal.2004@meetza.com', '$2b$10$VN/wcdNcWg3ORhmNi8el..CylHQMaTmADiTNLM9B0JdLEY9aUL3oq', 'Administrator', NULL, 1, 'https://res.cloudinary.com/dax2irx1f/image/upload/v1777839092/posters/x8tjkq5qufkez4wgqi0c.png', '2025-12-02 15:39:06', '2026-05-04 15:14:31', 'light');

-- --------------------------------------------------------

--
-- Table structure for table `video`
--

CREATE TABLE `video` (
  `id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `meeting_id` varchar(36) DEFAULT NULL,
  `video_url` text NOT NULL,
  `poster_url` text DEFAULT NULL,
  `administrator_id` varchar(36) NOT NULL,
  `duration` time NOT NULL,
  `description` text DEFAULT NULL,
  `group_id` varchar(36) NOT NULL,
  `slug` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `video_transcript_summary`
--

CREATE TABLE `video_transcript_summary` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `video_id` varchar(36) NOT NULL,
  `language` varchar(10) NOT NULL,
  `transcript` longtext DEFAULT NULL,
  `summary` longtext DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `topics` longtext DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `video_watch_progress`
--

CREATE TABLE `video_watch_progress` (
  `user_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `video_id` varchar(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `progress_seconds` int(10) UNSIGNED NOT NULL DEFAULT 0,
  `completed` tinyint(1) NOT NULL DEFAULT 0,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `administrator`
--
ALTER TABLE `administrator`
  ADD PRIMARY KEY (`user_id`);

--
-- Indexes for table `chat_bot_cache`
--
ALTER TABLE `chat_bot_cache`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uk_chat_bot_cache_question_key` (`question_key`),
  ADD KEY `idx_chat_bot_cache_expires_at` (`expires_at`);

--
-- Indexes for table `comment`
--
ALTER TABLE `comment`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_member_id` (`member_id`),
  ADD KEY `idx_video_id` (`video_id`),
  ADD KEY `idx_timestamp` (`timestamp`),
  ADD KEY `fk_comment_comment` (`parent_id`);

--
-- Indexes for table `companies`
--
ALTER TABLE `companies`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_companies_active` (`is_active`);

--
-- Indexes for table `company_settings`
--
ALTER TABLE `company_settings`
  ADD PRIMARY KEY (`company_id`),
  ADD UNIQUE KEY `company_id_2` (`company_id`),
  ADD KEY `company_id` (`company_id`);

--
-- Indexes for table `group`
--
ALTER TABLE `group`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_year_semester` (`year`,`semester`);

--
-- Indexes for table `group_admin`
--
ALTER TABLE `group_admin`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_group_admin` (`group_id`,`user_id`),
  ADD KEY `idx_group_admin_group_id` (`group_id`),
  ADD KEY `idx_group_admin_user_id` (`user_id`),
  ADD KEY `fk_group_admin_assigned_by` (`assigned_by`);

--
-- Indexes for table `group_content`
--
ALTER TABLE `group_content`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_group` (`group_id`);

--
-- Indexes for table `group_content_resource`
--
ALTER TABLE `group_content_resource`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_group_content_id` (`group_content_id`);

--
-- Indexes for table `group_membership`
--
ALTER TABLE `group_membership`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_group_member` (`group_id`,`member_id`),
  ADD KEY `idx_group_id` (`group_id`),
  ADD KEY `idx_member_id` (`member_id`);

--
-- Indexes for table `group_message`
--
ALTER TABLE `group_message`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_group_id` (`group_id`),
  ADD KEY `idx_sender_id` (`sender_id`),
  ADD KEY `idx_created_at` (`created_at`),
  ADD KEY `idx_parent_message_id` (`parent_message_id`);

--
-- Indexes for table `group_message_media`
--
ALTER TABLE `group_message_media`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_group_id` (`group_id`),
  ADD KEY `idx_sender_id` (`sender_id`),
  ADD KEY `idx_message_id` (`message_id`);

--
-- Indexes for table `like`
--
ALTER TABLE `like`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_member_video_like` (`member_id`,`video_id`),
  ADD KEY `idx_member_id` (`member_id`),
  ADD KEY `idx_video_id` (`video_id`),
  ADD KEY `idx_like_type` (`like_type`);

--
-- Indexes for table `meeting`
--
ALTER TABLE `meeting`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_group_id` (`group_id`),
  ADD KEY `idx_status` (`status`);

--
-- Indexes for table `meeting_admin`
--
ALTER TABLE `meeting_admin`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_meeting_admin` (`meeting_id`,`user_id`),
  ADD KEY `idx_meeting_admin_meeting_id` (`meeting_id`),
  ADD KEY `idx_meeting_admin_user_id` (`user_id`),
  ADD KEY `fk_meeting_admin_assigned_by` (`assigned_by`);

--
-- Indexes for table `meeting_participant`
--
ALTER TABLE `meeting_participant`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_meeting_member` (`meeting_id`,`user_id`),
  ADD KEY `idx_meeting_id` (`meeting_id`),
  ADD KEY `idx_member_id` (`user_id`);

--
-- Indexes for table `meeting_series`
--
ALTER TABLE `meeting_series`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_meeting_series_active` (`is_active`),
  ADD KEY `idx_meeting_series_group` (`group_id`),
  ADD KEY `fk_meeting_series_original_meeting` (`original_meeting_id`);

--
-- Indexes for table `member`
--
ALTER TABLE `member`
  ADD PRIMARY KEY (`user_id`);

--
-- Indexes for table `message_reaction`
--
ALTER TABLE `message_reaction`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_message_user` (`message_id`,`user_id`),
  ADD KEY `idx_reaction_message_id` (`message_id`),
  ADD KEY `idx_reaction_user_id` (`user_id`);

--
-- Indexes for table `message_read_status`
--
ALTER TABLE `message_read_status`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_message_user` (`message_id`,`user_id`),
  ADD KEY `idx_message_id` (`message_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_is_read` (`is_read`),
  ADD KEY `idx_read_at` (`read_at`);

--
-- Indexes for table `notifications`
--
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_member_id` (`member_id`),
  ADD KEY `idx_sender_id` (`sender_id`),
  ADD KEY `idx_is_read` (`is_read`),
  ADD KEY `idx_created_at` (`created_at`);

--
-- Indexes for table `notification_pending_group_action`
--
ALTER TABLE `notification_pending_group_action`
  ADD PRIMARY KEY (`notification_id`),
  ADD KEY `idx_npga_pending_group` (`pending_group_id`);

--
-- Indexes for table `organization_domain`
--
ALTER TABLE `organization_domain`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `primaryKey` (`company_id`,`domain_name`);

--
-- Indexes for table `pending_groups`
--
ALTER TABLE `pending_groups`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_created_by` (`created_by`),
  ADD KEY `idx_status` (`status`),
  ADD KEY `fk_pending_groups_approved_by` (`approved_by`),
  ADD KEY `fk_pending_groups_rejected_by` (`rejected_by`);

--
-- Indexes for table `pending_group_admins`
--
ALTER TABLE `pending_group_admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_pending_group_admin` (`pending_group_id`,`user_id`),
  ADD KEY `idx_pending_group_admin_pending_group_id` (`pending_group_id`),
  ADD KEY `idx_pending_group_admin_user_id` (`user_id`),
  ADD KEY `fk_pending_group_admin_assigned_by` (`assigned_by`);

--
-- Indexes for table `position`
--
ALTER TABLE `position`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_administrator_id` (`administrator_id`);

--
-- Indexes for table `resource_ai_metadata`
--
ALTER TABLE `resource_ai_metadata`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_resource_language` (`resource_id`,`language`),
  ADD KEY `idx_resource_id` (`resource_id`),
  ADD KEY `idx_language` (`language`);

--
-- Indexes for table `saved_video`
--
ALTER TABLE `saved_video`
  ADD PRIMARY KEY (`member_id`,`video_id`),
  ADD KEY `idx_member_id` (`member_id`),
  ADD KEY `idx_video_id` (`video_id`),
  ADD KEY `idx_timestamp` (`timestamp`);

--
-- Indexes for table `social_auth`
--
ALTER TABLE `social_auth`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_provider_provider_id` (`provider`,`provider_id`),
  ADD KEY `idx_user_id` (`user_id`),
  ADD KEY `idx_provider` (`provider`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `idx_email` (`email`),
  ADD KEY `idx_role` (`role`);

--
-- Indexes for table `video`
--
ALTER TABLE `video`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `slug` (`slug`),
  ADD KEY `idx_meeting_id` (`meeting_id`),
  ADD KEY `idx_administrator_id` (`administrator_id`),
  ADD KEY `idx_group_id` (`group_id`);

--
-- Indexes for table `video_transcript_summary`
--
ALTER TABLE `video_transcript_summary`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `unique_video_language` (`video_id`,`language`),
  ADD KEY `idx_video_id` (`video_id`),
  ADD KEY `idx_language` (`language`);

--
-- Indexes for table `video_watch_progress`
--
ALTER TABLE `video_watch_progress`
  ADD PRIMARY KEY (`user_id`,`video_id`),
  ADD KEY `user_id` (`user_id`,`video_id`),
  ADD KEY `video_ibfk_11` (`video_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `resource_ai_metadata`
--
ALTER TABLE `resource_ai_metadata`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `video_transcript_summary`
--
ALTER TABLE `video_transcript_summary`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `administrator`
--
ALTER TABLE `administrator`
  ADD CONSTRAINT `fk_administrator_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `comment`
--
ALTER TABLE `comment`
  ADD CONSTRAINT `fk_comment_comment` FOREIGN KEY (`parent_id`) REFERENCES `comment` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_comment_member` FOREIGN KEY (`member_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_comment_video` FOREIGN KEY (`video_id`) REFERENCES `video` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `company_settings`
--
ALTER TABLE `company_settings`
  ADD CONSTRAINT `fk_company_settings_company` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `group_admin`
--
ALTER TABLE `group_admin`
  ADD CONSTRAINT `fk_group_admin_assigned_by` FOREIGN KEY (`assigned_by`) REFERENCES `administrator` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_group_admin_group` FOREIGN KEY (`group_id`) REFERENCES `group` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_group_admin_user` FOREIGN KEY (`user_id`) REFERENCES `administrator` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `group_content`
--
ALTER TABLE `group_content`
  ADD CONSTRAINT `fk_group` FOREIGN KEY (`group_id`) REFERENCES `group` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `group_content_resource`
--
ALTER TABLE `group_content_resource`
  ADD CONSTRAINT `fk_group_content_resource_content` FOREIGN KEY (`group_content_id`) REFERENCES `group_content` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `group_membership`
--
ALTER TABLE `group_membership`
  ADD CONSTRAINT `fk_group_membership_group` FOREIGN KEY (`group_id`) REFERENCES `group` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_group_membership_member` FOREIGN KEY (`member_id`) REFERENCES `member` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `group_message`
--
ALTER TABLE `group_message`
  ADD CONSTRAINT `fk_group_message_group` FOREIGN KEY (`group_id`) REFERENCES `group` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_group_message_parent` FOREIGN KEY (`parent_message_id`) REFERENCES `group_message` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_group_message_sender` FOREIGN KEY (`sender_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `group_message_media`
--
ALTER TABLE `group_message_media`
  ADD CONSTRAINT `fk_group_message_media_group` FOREIGN KEY (`group_id`) REFERENCES `group` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_group_message_media_message` FOREIGN KEY (`message_id`) REFERENCES `group_message` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_group_message_media_sender` FOREIGN KEY (`sender_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `like`
--
ALTER TABLE `like`
  ADD CONSTRAINT `fk_like_member` FOREIGN KEY (`member_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_like_video` FOREIGN KEY (`video_id`) REFERENCES `video` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `meeting`
--
ALTER TABLE `meeting`
  ADD CONSTRAINT `fk_meeting_group` FOREIGN KEY (`group_id`) REFERENCES `group` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `meeting_admin`
--
ALTER TABLE `meeting_admin`
  ADD CONSTRAINT `fk_meeting_admin_assigned_by` FOREIGN KEY (`assigned_by`) REFERENCES `administrator` (`user_id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_meeting_admin_meeting` FOREIGN KEY (`meeting_id`) REFERENCES `meeting` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_meeting_admin_user` FOREIGN KEY (`user_id`) REFERENCES `administrator` (`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `meeting_participant`
--
ALTER TABLE `meeting_participant`
  ADD CONSTRAINT `fk_meeting_participant_meeting` FOREIGN KEY (`meeting_id`) REFERENCES `meeting` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_meeting_participant_member` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `meeting_series`
--
ALTER TABLE `meeting_series`
  ADD CONSTRAINT `fk_meeting_series_group` FOREIGN KEY (`group_id`) REFERENCES `group` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_meeting_series_original_meeting` FOREIGN KEY (`original_meeting_id`) REFERENCES `meeting` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `member`
--
ALTER TABLE `member`
  ADD CONSTRAINT `fk_member_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `message_reaction`
--
ALTER TABLE `message_reaction`
  ADD CONSTRAINT `fk_reaction_message` FOREIGN KEY (`message_id`) REFERENCES `group_message` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_reaction_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `message_read_status`
--
ALTER TABLE `message_read_status`
  ADD CONSTRAINT `fk_message_read_status_message` FOREIGN KEY (`message_id`) REFERENCES `group_message` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_message_read_status_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `notifications`
--
ALTER TABLE `notifications`
  ADD CONSTRAINT `fk_notifications_member` FOREIGN KEY (`member_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_notifications_sender` FOREIGN KEY (`sender_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `notification_pending_group_action`
--
ALTER TABLE `notification_pending_group_action`
  ADD CONSTRAINT `fk_npga_notification` FOREIGN KEY (`notification_id`) REFERENCES `notifications` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `organization_domain`
--
ALTER TABLE `organization_domain`
  ADD CONSTRAINT `company_ibfk_1` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `pending_groups`
--
ALTER TABLE `pending_groups`
  ADD CONSTRAINT `fk_pending_groups_approved_by` FOREIGN KEY (`approved_by`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pending_groups_created_by` FOREIGN KEY (`created_by`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pending_groups_rejected_by` FOREIGN KEY (`rejected_by`) REFERENCES `user` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `pending_group_admins`
--
ALTER TABLE `pending_group_admins`
  ADD CONSTRAINT `fk_pending_group_admin_assigned_by` FOREIGN KEY (`assigned_by`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pending_group_admin_pending_group` FOREIGN KEY (`pending_group_id`) REFERENCES `pending_groups` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_pending_group_admin_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `position`
--
ALTER TABLE `position`
  ADD CONSTRAINT `fk_position_administrator` FOREIGN KEY (`administrator_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `resource_ai_metadata`
--
ALTER TABLE `resource_ai_metadata`
  ADD CONSTRAINT `fk_resource_ai_metadata_resource` FOREIGN KEY (`resource_id`) REFERENCES `group_content_resource` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `saved_video`
--
ALTER TABLE `saved_video`
  ADD CONSTRAINT `fk_saved_video_member` FOREIGN KEY (`member_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_saved_video_video` FOREIGN KEY (`video_id`) REFERENCES `video` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `social_auth`
--
ALTER TABLE `social_auth`
  ADD CONSTRAINT `fk_social_auth_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `video`
--
ALTER TABLE `video`
  ADD CONSTRAINT `fk_video_administrator` FOREIGN KEY (`administrator_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_video_group` FOREIGN KEY (`group_id`) REFERENCES `group` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_video_meeting` FOREIGN KEY (`meeting_id`) REFERENCES `meeting` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Constraints for table `video_transcript_summary`
--
ALTER TABLE `video_transcript_summary`
  ADD CONSTRAINT `fk_video_transcript_summary_video` FOREIGN KEY (`video_id`) REFERENCES `video` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `video_watch_progress`
--
ALTER TABLE `video_watch_progress`
  ADD CONSTRAINT `user_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `video_ibfk_11` FOREIGN KEY (`video_id`) REFERENCES `video` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
