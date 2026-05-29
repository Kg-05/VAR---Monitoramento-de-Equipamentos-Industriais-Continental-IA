-- CreateTable
CREATE TABLE `empresas` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `cnpj` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `telefone` VARCHAR(191) NULL,
    `status` ENUM('Ativo', 'Inativo') NOT NULL DEFAULT 'Ativo',
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `empresas_cnpj_key`(`cnpj`),
    UNIQUE INDEX `empresas_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `usuarios` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `senhaHash` VARCHAR(191) NOT NULL,
    `papel` ENUM('ADM', 'Operacional', 'Cliente') NOT NULL,
    `status` ENUM('Ativo', 'Inativo') NOT NULL DEFAULT 'Ativo',
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `empresaId` VARCHAR(191) NULL,

    UNIQUE INDEX `usuarios_email_key`(`email`),
    INDEX `usuarios_empresaId_idx`(`empresaId`),
    INDEX `usuarios_papel_idx`(`papel`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `funcionarios` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `cargo` VARCHAR(191) NOT NULL,
    `telefone` VARCHAR(191) NULL,
    `status` ENUM('Ativo', 'Inativo', 'Pendente') NOT NULL DEFAULT 'Pendente',
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `empresaId` VARCHAR(191) NOT NULL,

    INDEX `funcionarios_empresaId_idx`(`empresaId`),
    INDEX `funcionarios_status_idx`(`status`),
    UNIQUE INDEX `funcionarios_email_empresaId_key`(`email`, `empresaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `equipamentos` (
    `id` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `modelo` VARCHAR(191) NOT NULL,
    `fabricante` VARCHAR(191) NULL,
    `numeroSerie` VARCHAR(191) NULL,
    `localizacao` VARCHAR(191) NOT NULL,
    `status` ENUM('Operacional', 'Manutencao') NOT NULL DEFAULT 'Operacional',
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `empresaId` VARCHAR(191) NOT NULL,

    INDEX `equipamentos_empresaId_idx`(`empresaId`),
    INDEX `equipamentos_status_idx`(`status`),
    UNIQUE INDEX `equipamentos_numeroSerie_empresaId_key`(`numeroSerie`, `empresaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `alertas` (
    `id` VARCHAR(191) NOT NULL,
    `descricao` VARCHAR(191) NOT NULL,
    `nivel` ENUM('razoavel', 'medio', 'critico') NOT NULL,
    `lidoEm` DATETIME(3) NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `empresaId` VARCHAR(191) NOT NULL,
    `equipamentoId` VARCHAR(191) NOT NULL,
    `lidoPorId` VARCHAR(191) NULL,

    INDEX `alertas_empresaId_idx`(`empresaId`),
    INDEX `alertas_equipamentoId_idx`(`equipamentoId`),
    INDEX `alertas_nivel_idx`(`nivel`),
    INDEX `alertas_lidoPorId_idx`(`lidoPorId`),
    INDEX `alertas_criadoEm_idx`(`criadoEm`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `logs` (
    `id` VARCHAR(191) NOT NULL,
    `acao` VARCHAR(191) NOT NULL,
    `nivelUsuario` ENUM('ADM', 'Operacional', 'Cliente') NOT NULL,
    `ip` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `statusHttp` INTEGER NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `usuarioId` VARCHAR(191) NULL,
    `empresaId` VARCHAR(191) NULL,

    INDEX `logs_usuarioId_idx`(`usuarioId`),
    INDEX `logs_empresaId_idx`(`empresaId`),
    INDEX `logs_criadoEm_idx`(`criadoEm`),
    INDEX `logs_nivelUsuario_idx`(`nivelUsuario`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `licencas` (
    `id` VARCHAR(191) NOT NULL,
    `plano` ENUM('Basico', 'Profissional', 'Premium') NOT NULL,
    `status` ENUM('Ativa', 'Expirada', 'Suspensa') NOT NULL DEFAULT 'Ativa',
    `maxDeFuncionarios` INTEGER NOT NULL,
    `inicioEm` DATETIME(3) NOT NULL,
    `expiraEm` DATETIME(3) NOT NULL,
    `observacoes` VARCHAR(191) NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `empresaId` VARCHAR(191) NOT NULL,

    INDEX `licencas_empresaId_idx`(`empresaId`),
    INDEX `licencas_status_idx`(`status`),
    INDEX `licencas_expiraEm_idx`(`expiraEm`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pagamentos` (
    `id` VARCHAR(191) NOT NULL,
    `valor` DECIMAL(10, 2) NOT NULL,
    `moeda` VARCHAR(191) NOT NULL DEFAULT 'AOA',
    `status` ENUM('Pendente', 'Concluido', 'Reembolsado') NOT NULL DEFAULT 'Pendente',
    `referencia` VARCHAR(191) NULL,
    `criadoEm` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `empresaId` VARCHAR(191) NOT NULL,
    `licencaId` VARCHAR(191) NOT NULL,

    INDEX `pagamentos_empresaId_idx`(`empresaId`),
    INDEX `pagamentos_licencaId_idx`(`licencaId`),
    INDEX `pagamentos_status_idx`(`status`),
    INDEX `pagamentos_criadoEm_idx`(`criadoEm`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `usuarios` ADD CONSTRAINT `usuarios_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `empresas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `funcionarios` ADD CONSTRAINT `funcionarios_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `empresas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `equipamentos` ADD CONSTRAINT `equipamentos_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `empresas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `alertas` ADD CONSTRAINT `alertas_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `empresas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `alertas` ADD CONSTRAINT `alertas_equipamentoId_fkey` FOREIGN KEY (`equipamentoId`) REFERENCES `equipamentos`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `alertas` ADD CONSTRAINT `alertas_lidoPorId_fkey` FOREIGN KEY (`lidoPorId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `logs` ADD CONSTRAINT `logs_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `logs` ADD CONSTRAINT `logs_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `empresas`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `licencas` ADD CONSTRAINT `licencas_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `empresas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pagamentos` ADD CONSTRAINT `pagamentos_empresaId_fkey` FOREIGN KEY (`empresaId`) REFERENCES `empresas`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `pagamentos` ADD CONSTRAINT `pagamentos_licencaId_fkey` FOREIGN KEY (`licencaId`) REFERENCES `licencas`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
