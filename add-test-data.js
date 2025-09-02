const { pool } = require('./config/database');
const bcrypt = require('bcryptjs');

async function addTestData() {
  try {
    console.log('🚀 Ajout de données de test dans la base de données...');

    // 1. Ajouter des utilisateurs de test
    console.log('👥 Ajout d\'utilisateurs de test...');
    const users = [
      {
        username: 'admin1',
        email: 'admin1@bms.com',
        password: 'admin123',
        role: 'admin',
        nom: 'Admin',
        prenom: 'Principal'
      },
      {
        username: 'user1',
        email: 'user1@bms.com',
        password: 'user123',
        role: 'user',
        nom: 'User',
        prenom: 'Test'
      },
      {
        username: 'pole1',
        email: 'pole1@bms.com',
        password: 'pole123',
        role: 'pole_lead',
        nom: 'Pole',
        prenom: 'Lead'
      }
    ];

    for (const user of users) {
      const passwordHash = await bcrypt.hash(user.password, 10);
      await pool.query(`
        INSERT INTO users (username, email, password_hash, role, nom, prenom)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (email) DO NOTHING
      `, [user.username, user.email, passwordHash, user.role, user.nom, user.prenom]);
    }

    // 2. Ajouter des offres de test
    console.log('📋 Ajout d\'offres de test...');
    const offres = [
      {
        intitule_offre: 'Appel d\'offres pour services informatiques',
        bailleur: 'Ministère des Finances',
        pays: ['France', 'Belgique'],
        date_depot: '2025-01-15',
        date_soumission_validation: '2025-02-15',
        date_montage_administratif: '2025-01-20',
        statut: 'en_attente',
        priorite: 'Haute',
        pole_lead: 'Informatique',
        pole_associes: 'Finance',
        commentaire: 'Offre importante pour la modernisation des systèmes',
        montant: 500000.00,
        type_offre: 'AO'
      },
      {
        intitule_offre: 'Avis de manifestation d\'intérêt - Formation',
        bailleur: 'Agence de Développement',
        pays: ['France'],
        date_depot: '2025-01-20',
        date_soumission_validation: '2025-02-20',
        date_montage_administratif: '2025-01-25',
        statut: 'en_cours',
        priorite: 'Moyenne',
        pole_lead: 'Formation',
        pole_associes: 'RH',
        commentaire: 'Formation des équipes sur les nouvelles technologies',
        montant: 150000.00,
        type_offre: 'AMI'
      },
      {
        intitule_offre: 'Avis Général - Consultation',
        bailleur: 'Collectivité Territoriale',
        pays: ['France'],
        date_depot: '2025-01-25',
        date_soumission_validation: '2025-02-25',
        date_montage_administratif: '2025-01-30',
        statut: 'validé',
        priorite: 'Basse',
        pole_lead: 'Consultation',
        pole_associes: 'Juridique',
        commentaire: 'Consultation générale sur les services publics',
        montant: 75000.00,
        type_offre: 'Avis Général'
      },
      {
        intitule_offre: 'Appel à projet - Innovation',
        bailleur: 'Fonds Européen',
        pays: ['France', 'Allemagne', 'Italie'],
        date_depot: '2025-02-01',
        date_soumission_validation: '2025-03-01',
        date_montage_administratif: '2025-02-05',
        statut: 'en_attente',
        priorite: 'Haute',
        pole_lead: 'Innovation',
        pole_associes: 'Recherche',
        commentaire: 'Projet innovant dans le domaine des énergies renouvelables',
        montant: 1000000.00,
        type_offre: 'Appel à projet'
      },
      {
        intitule_offre: 'Accord cadre - Fournitures',
        bailleur: 'Ministère de l\'Éducation',
        pays: ['France'],
        date_depot: '2025-02-05',
        date_soumission_validation: '2025-03-05',
        date_montage_administratif: '2025-02-10',
        statut: 'en_cours',
        priorite: 'Moyenne',
        pole_lead: 'Logistique',
        pole_associes: 'Éducation',
        commentaire: 'Accord cadre pour fournitures scolaires',
        montant: 300000.00,
        type_offre: 'Accord cadre'
      }
    ];

    for (const offre of offres) {
      const result = await pool.query(`
        INSERT INTO offres (intitule_offre, bailleur, pays, date_depot, date_soumission_validation, 
                           date_montage_administratif, statut, priorite, pole_lead, pole_associes, 
                           commentaire, montant, type_offre)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING id
      `, [
        offre.intitule_offre, offre.bailleur, offre.pays, offre.date_depot,
        offre.date_soumission_validation, offre.date_montage_administratif,
        offre.statut, offre.priorite, offre.pole_lead, offre.pole_associes,
        offre.commentaire, offre.montant, offre.type_offre
      ]);

      const offreId = result.rows[0].id;

      // 3. Ajouter des répartitions pour chaque offre
      await pool.query(`
        INSERT INTO repartitions (offre_id, pole_lead, pole_associes)
        VALUES ($1, $2, $3)
      `, [offreId, offre.pole_lead, offre.pole_associes]);

      // 4. Ajouter des modalités des pôles
      await pool.query(`
        INSERT INTO modalites_poles (offre_id, pole, modalite, commentaire)
        VALUES ($1, $2, $3, $4)
      `, [offreId, offre.pole_lead, 'nouveau', 'Modalité initiale']);

      // 5. Ajouter des résultats
      await pool.query(`
        INSERT INTO resultats (offre_id, pole, resultat, date_depot_prevu, commentaire)
        VALUES ($1, $2, $3, $4, $5)
      `, [offreId, offre.pole_lead, 'en_cours', offre.date_depot, 'Résultat en cours de traitement']);

      // 6. Ajouter des alertes
      if (offre.statut === 'en_attente') {
        await pool.query(`
          INSERT INTO alertes (offre_id, type_alerte, message)
          VALUES ($1, $2, $3)
        `, [offreId, 'validation_requise', `Validation requise pour l'offre: ${offre.intitule_offre}`]);
      }
    }

    console.log('✅ Données de test ajoutées avec succès!');
    console.log('📊 Résumé:');
    console.log('   - 3 utilisateurs créés');
    console.log('   - 5 offres créées avec tous types (AO, AMI, Avis Général, Appel à projet, Accord cadre)');
    console.log('   - Répartitions, modalités, résultats et alertes associés');

  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout des données de test:', error);
  } finally {
    await pool.end();
  }
}

addTestData();
