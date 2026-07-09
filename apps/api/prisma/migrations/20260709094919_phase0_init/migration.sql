-- CreateTable
CREATE TABLE `health_checks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `status` VARCHAR(50) NOT NULL,
    `checked_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
