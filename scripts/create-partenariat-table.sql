-- Script de création de la table partenariat
-- Exécuter dans PostgreSQL

CREATE TABLE IF NOT EXISTS partenaires (
    id SERIAL PRIMARY KEY,
    nom_bureau VARCHAR(255) NOT NULL,
    contact VARCHAR(255) NOT NULL,
    cabinets_ayant_postule TEXT,
    contacts TEXT,
    domaine_expertise VARCHAR(255) NOT NULL,
    pays VARCHAR(100) NOT NULL,
    marche_gagne VARCHAR(255),
    duree VARCHAR(100),
    bailleur VARCHAR(255),
    valeur VARCHAR(100),
    marche_attribue_le DATE,
    date_creation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    date_modification TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_partenaires_pays ON partenaires(pays);
CREATE INDEX IF NOT EXISTS idx_partenaires_domaine ON partenaires(domaine_expertise);
CREATE INDEX IF NOT EXISTS idx_partenaires_nom_bureau ON partenaires(nom_bureau);

-- Commentaires sur la table
COMMENT ON TABLE partenaires IS 'Table des partenaires du BMS';
COMMENT ON COLUMN partenaires.nom_bureau IS 'Nom du bureau partenaire';
COMMENT ON COLUMN partenaires.contact IS 'Contact principal du partenaire';
COMMENT ON COLUMN partenaires.cabinets_ayant_postule IS 'Liste des cabinets ayant postulé';
COMMENT ON COLUMN partenaires.contacts IS 'Contacts additionnels';
COMMENT ON COLUMN partenaires.domaine_expertise IS 'Domaine d''expertise du partenaire';
COMMENT ON COLUMN partenaires.pays IS 'Pays du partenaire';
COMMENT ON COLUMN partenaires.marche_gagne IS 'Marché gagné par le partenaire';
COMMENT ON COLUMN partenaires.duree IS 'Durée du projet';
COMMENT ON COLUMN partenaires.bailleur IS 'Bailleur de fonds';
COMMENT ON COLUMN partenaires.valeur IS 'Valeur du marché';
COMMENT ON COLUMN partenaires.marche_attribue_le IS 'Date d''attribution du marché';
COMMENT ON COLUMN partenaires.date_creation IS 'Date de création de l''enregistrement';
COMMENT ON COLUMN partenaires.date_modification IS 'Date de dernière modification';

-- Trigger pour mettre à jour automatiquement date_modification
CREATE OR REPLACE FUNCTION update_date_modification()
RETURNS TRIGGER AS $$
BEGIN
    NEW.date_modification = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_date_modification
    BEFORE UPDATE ON partenaires
    FOR EACH ROW
    EXECUTE FUNCTION update_date_modification();
