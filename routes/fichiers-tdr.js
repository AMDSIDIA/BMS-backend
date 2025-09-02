const express = require('express');
const multer = require('multer');
const { pool } = require('../config/database');
const router = express.Router();

// Configuration de multer pour la gestion des fichiers
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
  fileFilter: (req, file, cb) => {
    // Accepter seulement les fichiers PDF, Word, Excel
    if (file.mimetype === 'application/pdf' || 
        file.mimetype === 'application/msword' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.mimetype === 'application/vnd.ms-excel' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
      cb(null, true);
    } else {
      cb(new Error('Type de fichier non supporté. Seuls les fichiers PDF, Word et Excel sont acceptés.'), false);
    }
  }
});

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token d\'accès requis' });
  }

  const jwt = require('jsonwebtoken');
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token invalide' });
    }
    req.user = user;
    next();
  });
};

// Upload d'un fichier TDR pour une offre
router.post('/upload/:offreId', authenticateToken, upload.single('fichier'), async (req, res) => {
  try {
    const { offreId } = req.params;
    const { description, version } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    // Vérifier que l'offre existe
    const offreCheck = await pool.query('SELECT id FROM offres WHERE id = $1', [offreId]);
    if (offreCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Offre non trouvée' });
    }

    // Insérer le fichier dans la base
    const result = await pool.query(`
      INSERT INTO fichiers_tdr (nom_fichier, type_mime, taille, contenu, offre_id, description, version)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, nom_fichier, type_mime, taille, date_upload, description, version
    `, [
      file.originalname,
      file.mimetype,
      file.size,
      file.buffer,
      offreId,
      description || null,
      version || '1.0'
    ]);

    // Mettre à jour la liste des fichiers TDR de l'offre
    await pool.query(`
      UPDATE offres 
      SET fichiers_tdr_ids = array_append(fichiers_tdr_ids, $1)
      WHERE id = $2
    `, [result.rows[0].id, offreId]);

    res.json({
      success: true,
      message: 'Fichier TDR uploadé avec succès',
      fichier: result.rows[0]
    });

  } catch (error) {
    console.error('Erreur lors de l\'upload du fichier TDR:', error);
    res.status(500).json({ error: 'Erreur lors de l\'upload du fichier TDR' });
  }
});

// Récupérer tous les fichiers TDR d'une offre
router.get('/offre/:offreId', authenticateToken, async (req, res) => {
  try {
    const { offreId } = req.params;

    const result = await pool.query(`
      SELECT id, nom_fichier, type_mime, taille, date_upload, description, version
      FROM fichiers_tdr
      WHERE offre_id = $1
      ORDER BY date_upload DESC
    `, [offreId]);

    res.json({
      success: true,
      fichiers: result.rows
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des fichiers TDR:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des fichiers TDR' });
  }
});

// Télécharger un fichier TDR
router.get('/download/:fichierId', authenticateToken, async (req, res) => {
  try {
    const { fichierId } = req.params;

    const result = await pool.query(`
      SELECT nom_fichier, type_mime, contenu
      FROM fichiers_tdr
      WHERE id = $1
    `, [fichierId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }

    const fichier = result.rows[0];

    // Définir les headers pour le téléchargement
    res.setHeader('Content-Type', fichier.type_mime);
    res.setHeader('Content-Disposition', `attachment; filename="${fichier.nom_fichier}"`);
    
    // Envoyer le contenu du fichier
    res.send(fichier.contenu);

  } catch (error) {
    console.error('Erreur lors du téléchargement du fichier TDR:', error);
    res.status(500).json({ error: 'Erreur lors du téléchargement du fichier TDR' });
  }
});

// Supprimer un fichier TDR
router.delete('/:fichierId', authenticateToken, async (req, res) => {
  try {
    const { fichierId } = req.params;

    // Récupérer l'offre_id avant de supprimer le fichier
    const offreResult = await pool.query('SELECT offre_id FROM fichiers_tdr WHERE id = $1', [fichierId]);
    if (offreResult.rows.length === 0) {
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }

    const offreId = offreResult.rows[0].offre_id;

    // Supprimer le fichier
    await pool.query('DELETE FROM fichiers_tdr WHERE id = $1', [fichierId]);

    // Mettre à jour la liste des fichiers TDR de l'offre
    await pool.query(`
      UPDATE offres 
      SET fichiers_tdr_ids = array_remove(fichiers_tdr_ids, $1)
      WHERE id = $2
    `, [fichierId, offreId]);

    res.json({
      success: true,
      message: 'Fichier TDR supprimé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la suppression du fichier TDR:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression du fichier TDR' });
  }
});

// Mettre à jour les informations d'un fichier TDR
router.put('/:fichierId', authenticateToken, async (req, res) => {
  try {
    const { fichierId } = req.params;
    const { description, version } = req.body;

    const result = await pool.query(`
      UPDATE fichiers_tdr
      SET description = $1, version = $2
      WHERE id = $3
      RETURNING id, nom_fichier, type_mime, taille, date_upload, description, version
    `, [description, version, fichierId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }

    res.json({
      success: true,
      message: 'Fichier TDR mis à jour avec succès',
      fichier: result.rows[0]
    });

  } catch (error) {
    console.error('Erreur lors de la mise à jour du fichier TDR:', error);
    res.status(500).json({ error: 'Erreur lors de la mise à jour du fichier TDR' });
  }
});

// Récupérer les statistiques des fichiers TDR
router.get('/statistiques', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_fichiers,
        COUNT(DISTINCT offre_id) as offres_avec_fichiers,
        SUM(taille) as taille_totale,
        AVG(taille) as taille_moyenne
      FROM fichiers_tdr
    `);

    const typesResult = await pool.query(`
      SELECT 
        type_mime,
        COUNT(*) as nombre
      FROM fichiers_tdr
      GROUP BY type_mime
      ORDER BY nombre DESC
    `);

    res.json({
      success: true,
      statistiques: result.rows[0],
      types_fichiers: typesResult.rows
    });

  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des statistiques' });
  }
});

module.exports = router;
