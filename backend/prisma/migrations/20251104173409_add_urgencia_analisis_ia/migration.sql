-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_OrdenTrabajo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "clienteId" INTEGER NOT NULL,
    "equipoId" INTEGER,
    "tipo" TEXT NOT NULL,
    "fecha" DATETIME NOT NULL,
    "notas" TEXT,
    "tecnico" TEXT NOT NULL,
    "estado" TEXT NOT NULL DEFAULT 'pendiente',
    "urgencia" TEXT NOT NULL DEFAULT 'media',
    "analisisIA" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OrdenTrabajo_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OrdenTrabajo_equipoId_fkey" FOREIGN KEY ("equipoId") REFERENCES "Equipo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_OrdenTrabajo" ("clienteId", "createdAt", "equipoId", "estado", "fecha", "id", "notas", "tecnico", "tipo", "updatedAt") SELECT "clienteId", "createdAt", "equipoId", "estado", "fecha", "id", "notas", "tecnico", "tipo", "updatedAt" FROM "OrdenTrabajo";
DROP TABLE "OrdenTrabajo";
ALTER TABLE "new_OrdenTrabajo" RENAME TO "OrdenTrabajo";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
