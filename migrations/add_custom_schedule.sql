-- Migration: Ajout du champ custom_schedule pour les recherches programmées personnalisées
-- Date: 2024-12-19

-- Vérifier si la colonne existe déjà
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'scheduled_searches' 
        AND column_name = 'custom_schedule'
    ) THEN
        -- Ajouter la colonne custom_schedule
        ALTER TABLE scheduled_searches 
        ADD COLUMN custom_schedule TEXT;
        
        -- Ajouter un commentaire sur la colonne
        COMMENT ON COLUMN scheduled_searches.custom_schedule IS 'Configuration JSON personnalisée pour les plannings sur mesure';
        
        RAISE NOTICE 'Colonne custom_schedule ajoutée avec succès';
    ELSE
        RAISE NOTICE 'La colonne custom_schedule existe déjà';
    END IF;
END $$;

-- Mettre à jour les enregistrements existants pour avoir une valeur par défaut
UPDATE scheduled_searches 
SET custom_schedule = NULL 
WHERE custom_schedule IS NULL;

-- Vérifier la structure de la table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'scheduled_searches' 
ORDER BY ordinal_position;
