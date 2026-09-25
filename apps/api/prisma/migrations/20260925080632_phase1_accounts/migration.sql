-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(36) NOT NULL,
    `email` VARCHAR(255) NOT NULL,
    `password_hash` VARCHAR(255) NULL,
    `name` VARCHAR(100) NOT NULL,
    `avatar_media_id` VARCHAR(36) NULL,
    `bio` VARCHAR(500) NULL,
    `locale` VARCHAR(5) NOT NULL DEFAULT 'en',
    `timezone` VARCHAR(50) NOT NULL DEFAULT 'UTC',
    `media_quota_bytes` BIGINT NOT NULL DEFAULT 1073741824,
    `media_used_bytes` BIGINT NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `email_verified` BOOLEAN NOT NULL DEFAULT false,
    `last_login_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,
    `scheduled_deletion_at` DATETIME(3) NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    INDEX `users_email_idx`(`email`),
    INDEX `users_created_at_idx`(`created_at`),
    INDEX `users_scheduled_deletion_at_idx`(`scheduled_deletion_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` VARCHAR(36) NOT NULL,
    `token_hash` VARCHAR(255) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `revoked_at` DATETIME(3) NULL,
    `replaced_by` VARCHAR(36) NULL,
    `user_agent` VARCHAR(500) NULL,
    `ip_address` VARCHAR(45) NULL,

    UNIQUE INDEX `refresh_tokens_token_hash_key`(`token_hash`),
    INDEX `refresh_tokens_user_id_idx`(`user_id`),
    INDEX `refresh_tokens_expires_at_idx`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `oauth_providers` (
    `id` VARCHAR(36) NOT NULL,
    `provider` VARCHAR(50) NOT NULL,
    `provider_id` VARCHAR(255) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `email` VARCHAR(255) NULL,
    `name` VARCHAR(255) NULL,
    `avatar_url` VARCHAR(500) NULL,
    `metadata` JSON NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `oauth_providers_user_id_idx`(`user_id`),
    INDEX `oauth_providers_provider_email_idx`(`provider`, `email`),
    UNIQUE INDEX `oauth_providers_provider_provider_id_key`(`provider`, `provider_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `email_verification_tokens` (
    `id` VARCHAR(36) NOT NULL,
    `token_hash` VARCHAR(255) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `used_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `email_verification_tokens_token_hash_key`(`token_hash`),
    INDEX `email_verification_tokens_user_id_idx`(`user_id`),
    INDEX `email_verification_tokens_expires_at_idx`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `password_reset_tokens` (
    `id` VARCHAR(36) NOT NULL,
    `token_hash` VARCHAR(255) NOT NULL,
    `user_id` VARCHAR(36) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `used_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `password_reset_tokens_token_hash_key`(`token_hash`),
    INDEX `password_reset_tokens_user_id_idx`(`user_id`),
    INDEX `password_reset_tokens_expires_at_idx`(`expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `audit_logs` (
    `id` VARCHAR(36) NOT NULL,
    `user_id` VARCHAR(36) NULL,
    `action` VARCHAR(100) NOT NULL,
    `entity` VARCHAR(100) NOT NULL,
    `entity_id` VARCHAR(36) NULL,
    `details` JSON NULL,
    `ip_address` VARCHAR(45) NULL,
    `user_agent` VARCHAR(500) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `audit_logs_user_id_idx`(`user_id`),
    INDEX `audit_logs_action_idx`(`action`),
    INDEX `audit_logs_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `oauth_providers` ADD CONSTRAINT `oauth_providers_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `email_verification_tokens` ADD CONSTRAINT `email_verification_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `password_reset_tokens` ADD CONSTRAINT `password_reset_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
