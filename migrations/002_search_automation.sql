-- Migration pour la recherche automatique d'opportunités
-- Création des tables pour la recherche automatique

-- Table pour l'historique des recherches
CREATE TABLE IF NOT EXISTS search_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keywords TEXT NOT NULL,
    results_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table pour les offres trouvées
CREATE TABLE IF NOT EXISTS offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    url TEXT NOT NULL,
    source TEXT NOT NULL,
    date TIMESTAMP DEFAULT NOW(),
    keywords JSONB,
    search_id UUID REFERENCES search_history(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table pour les offres validées par les utilisateurs
CREATE TABLE IF NOT EXISTS validated_offers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id UUID REFERENCES offers(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'en_cours' CHECK (status IN ('en_cours', 'depose', 'gagne', 'perdu')),
    validated_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(offer_id, user_id)
);

-- Table pour les mots-clés sauvegardés des utilisateurs
CREATE TABLE IF NOT EXISTS saved_keywords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    keywords TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table pour les recherches automatiques programmées
CREATE TABLE IF NOT EXISTS scheduled_searches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    keywords TEXT NOT NULL,
    frequency TEXT DEFAULT 'daily' CHECK (frequency IN ('daily', 'weekly', 'monthly')),
    last_run TIMESTAMP,
    next_run TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Index pour optimiser les recherches
CREATE INDEX IF NOT EXISTS idx_offers_title ON offers USING gin(to_tsvector('french', title));
CREATE INDEX IF NOT EXISTS idx_offers_description ON offers USING gin(to_tsvector('french', description));
CREATE INDEX IF NOT EXISTS idx_offers_keywords ON offers USING gin(keywords);
CREATE INDEX IF NOT EXISTS idx_offers_source ON offers(source);
CREATE INDEX IF NOT EXISTS idx_offers_date ON offers(date);
CREATE INDEX IF NOT EXISTS idx_offers_search_id ON offers(search_id);

CREATE INDEX IF NOT EXISTS idx_validated_offers_user_id ON validated_offers(user_id);
CREATE INDEX IF NOT EXISTS idx_validated_offers_offer_id ON validated_offers(offer_id);
CREATE INDEX IF NOT EXISTS idx_validated_offers_status ON validated_offers(status);

CREATE INDEX IF NOT EXISTS idx_search_history_keywords ON search_history USING gin(to_tsvector('french', keywords));
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON search_history(created_at);

CREATE INDEX IF NOT EXISTS idx_saved_keywords_user_id ON saved_keywords(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_searches_user_id ON scheduled_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_searches_next_run ON scheduled_searches(next_run);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour mettre à jour updated_at
CREATE TRIGGER update_search_history_updated_at BEFORE UPDATE ON search_history FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON offers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_validated_offers_updated_at BEFORE UPDATE ON validated_offers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_saved_keywords_updated_at BEFORE UPDATE ON saved_keywords FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scheduled_searches_updated_at BEFORE UPDATE ON scheduled_searches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour calculer la similarité entre deux textes
CREATE OR REPLACE FUNCTION calculate_text_similarity(text1 TEXT, text2 TEXT)
RETURNS FLOAT AS $$
DECLARE
    words1 TEXT[];
    words2 TEXT[];
    common_words INTEGER := 0;
    total_words INTEGER := 0;
    word TEXT;
BEGIN
    -- Tokeniser les textes en mots
    words1 := string_to_array(lower(text1), ' ');
    words2 := string_to_array(lower(text2), ' ');
    
    -- Compter les mots communs
    FOREACH word IN ARRAY words1
    LOOP
        IF word = ANY(words2) THEN
            common_words := common_words + 1;
        END IF;
    END LOOP;
    
    -- Calculer le total des mots uniques
    total_words := array_length(words1, 1) + array_length(words2, 1) - common_words;
    
    -- Retourner le score de similarité (Jaccard)
    IF total_words = 0 THEN
        RETURN 0.0;
    ELSE
        RETURN common_words::FLOAT / total_words::FLOAT;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Vue pour les statistiques de recherche
CREATE OR REPLACE VIEW search_stats AS
SELECT 
    COUNT(DISTINCT sh.id) as total_searches,
    COUNT(DISTINCT o.id) as total_offers_found,
    COUNT(DISTINCT vo.id) as total_validations,
    COUNT(DISTINCT vo.user_id) as active_users,
    AVG(sh.results_count) as avg_results_per_search,
    MAX(sh.created_at) as last_search_date
FROM search_history sh
LEFT JOIN offers o ON sh.id = o.search_id
LEFT JOIN validated_offers vo ON o.id = vo.offer_id;

-- Insertion de données de test
INSERT INTO search_history (keywords, results_count) VALUES 
('développement informatique', 15),
('formation professionnelle', 8),
('consultation IT', 12);

-- Insertion d'offres de test
INSERT INTO offers (title, description, url, source, keywords) VALUES 
('Appel d''offres - Développement d''application web', 'Développement d''une application web moderne pour la gestion des ressources humaines', 'https://example.com/ao-123', 'BOAMP', '["développement", "web", "application"]'),
('Avis général - Formation en cybersécurité', 'Formation professionnelle en cybersécurité pour les entreprises', 'https://example.com/ag-456', 'Legifrance', '["formation", "cybersécurité", "professionnelle"]'),
('Appel à projet - Digitalisation des services publics', 'Projet de digitalisation des services administratifs', 'https://example.com/ap-789', 'European Tenders', '["digitalisation", "services", "publics"]');

COMMIT;
