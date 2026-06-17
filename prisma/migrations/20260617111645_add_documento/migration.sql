-- CreateTable
CREATE TABLE `documentos` (
    `id` VARCHAR(191) NOT NULL,
    `nomeArquivo` VARCHAR(191) NOT NULL,
    `caminho` VARCHAR(191) NOT NULL,
    `status` ENUM('NaoLido', 'Lido', 'Arquivado') NOT NULL DEFAULT 'NaoLido',
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `empresaId` VARCHAR(191) NOT NULL,
    `responsavelId` VARCHAR(191) NULL,

    INDEX `documentos_empresaId_idx`(`empresaId`),
    INDEX `documentos_status_idx`(`status`),
    INDEX `documentos_responsavelId_idx`(`responsavelId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `documentos` ADD CONSTRAINT `documentos_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `empresas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documentos` ADD CONSTRAINT `documentos_responsavelId_fkey` FOREIGN KEY (`responsavelId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
