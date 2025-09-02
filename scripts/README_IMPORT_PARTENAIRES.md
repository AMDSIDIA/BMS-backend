# 📊 Import Partenaires BMS - Guide Complet

## 🎯 Objectif

Ce guide explique comment importer des données partenaires depuis un fichier Excel (.xlsx) vers la base de données PostgreSQL du BMS.

## 📋 Prérequis

### **1. Base de Données**
- ✅ PostgreSQL installé et en cours d'exécution
- ✅ Base de données BMS créée
- ✅ Variables d'environnement configurées

### **2. Dépendances Node.js**
```bash
cd backend
npm install pg xlsx dotenv
```

### **3. Fichier Excel**
- ✅ Format `.xlsx` (Excel 2007+)
- ✅ Première ligne = en-têtes des colonnes
- ✅ Données à partir de la deuxième ligne

## 🏗️ Structure de la Table

### **Table `partenaires`**
```sql
CREATE TABLE partenaires (
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
```

### **Champs Obligatoires**
- **NOM DU BUREAU** → `nom_bureau`
- **CONTACT** → `contact`
- **DOMAINE D'EXPERTISE** → `domaine_expertise`
- **PAYS** → `pays`

### **Champs Optionnels**
- **CABINETS AYANT POSTULE** → `cabinets_ayant_postule`
- **CONTACTS** → `contacts`
- **MARCHE GAGNE** → `marche_gagne`
- **DUREE** → `duree`
- **BAILLEUR** → `bailleur`
- **VALEUR** → `valeur`
- **MARCHE ATTRIBUE LE** → `marche_attribue_le`

## 📊 Format du Fichier Excel

### **En-têtes Requis**
```
| NOM DU BUREAU | CONTACT | CABINETS AYANT POSTULE | CONTACTS | DOMAINE D'EXPERTISE | PAYS | MARCHE GAGNE | DUREE | BAILLEUR | VALEUR | MARCHE ATTRIBUE LE |
```

### **Exemple de Données**
```
| Cabinet ABC    | Jean Dupont | Cabinet XYZ, Cabinet DEF | +33 1 23 45 67 89 | Ingénierie | France | Projet Route | 12 mois | Banque Mondiale | 500,000 EUR | 2024-01-15 |
| Bureau LMN     | Marie Martin | Cabinet GHI | +33 1 98 76 54 32 | Architecture | Belgique | Construction Pont | 18 mois | UE | 750,000 EUR | 2024-02-20 |
```

## 🚀 Processus d'Import

### **Étape 1: Créer la Table**
```bash
# Se connecter à PostgreSQL
psql -U postgres -d bms_db

# Exécuter le script SQL
\i scripts/create-partenariat-table.sql
```

### **Étape 2: Préparer l'Environnement**
```bash
cd backend/scripts

# Installer les dépendances si nécessaire
npm install pg xlsx dotenv
```

### **Étape 3: Configurer les Variables d'Environnement**
Créer/modifier le fichier `.env` dans le dossier `backend` :
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=bms_db
DB_USER=postgres
DB_PASSWORD=votre_mot_de_passe
```

### **Étape 4: Lancer l'Import**

#### **Windows (PowerShell/CMD)**
```cmd
# Avec le script batch
import-partenariat.bat "C:\chemin\vers\partenariat.xlsx"

# Ou directement avec Node.js
node import-partenariat.js "C:\chemin\vers\partenariat.xlsx"
```

#### **Linux/Mac (Terminal)**
```bash
# Rendre le script exécutable
chmod +x import-partenariat.sh

# Exécuter le script
./import-partenariat.sh "./partenariat.xlsx"

# Ou directement avec Node.js
node import-partenariat.js "./partenariat.xlsx"
```

## 📊 Suivi de l'Import

### **Logs en Temps Réel**
```
🚀 Début de l'import des partenaires...
📖 Lecture du fichier Excel...
📋 En-têtes détectés: [NOM DU BUREAU, CONTACT, ...]
📊 25 lignes de données à traiter
✅ Ligne 2: Partenaire inséré avec l'ID 1
✅ Ligne 3: Partenaire inséré avec l'ID 2
...
```

### **Résumé Final**
```
📊 RÉSUMÉ DE L'IMPORT
========================
✅ Succès: 23
❌ Erreurs: 2
📋 Total traité: 25

❌ DÉTAIL DES ERREURS:
  - Ligne 15: Champs obligatoires manquants
  - Ligne 22: Erreur de connexion à la base
```

## 🔧 Résolution des Problèmes

### **Erreur: "Table partenaires n'existe pas"**
```sql
-- Exécuter le script de création
\i scripts/create-partenariat-table.sql
```

### **Erreur: "Connection refused"**
- ✅ Vérifier que PostgreSQL est démarré
- ✅ Vérifier les paramètres de connexion dans `.env`
- ✅ Vérifier que le port 5432 est ouvert

### **Erreur: "Module not found"**
```bash
# Installer les dépendances manquantes
npm install pg xlsx dotenv
```

### **Erreur: "Permission denied"**
```bash
# Linux/Mac: Rendre le script exécutable
chmod +x import-partenariat.sh

# Windows: Exécuter en tant qu'administrateur
```

## 📋 Validation des Données

### **Après l'Import**
```sql
-- Vérifier le nombre de partenaires importés
SELECT COUNT(*) FROM partenaires;

-- Vérifier la structure des données
SELECT 
    nom_bureau, 
    contact, 
    domaine_expertise, 
    pays,
    date_creation
FROM partenaires 
ORDER BY date_creation DESC 
LIMIT 10;

-- Vérifier les pays uniques
SELECT DISTINCT pays FROM partenaires ORDER BY pays;

-- Vérifier les domaines d'expertise
SELECT DISTINCT domaine_expertise FROM partenaires ORDER BY domaine_expertise;
```

## 🎯 Bonnes Pratiques

### **Préparation du Fichier Excel**
1. ✅ **En-têtes exacts** : Respecter la casse et l'orthographe
2. ✅ **Données propres** : Éviter les caractères spéciaux problématiques
3. ✅ **Dates formatées** : Utiliser le format DD/MM/YYYY ou YYYY-MM-DD
4. ✅ **Pas de lignes vides** : Supprimer les lignes vides entre les données

### **Sécurité**
1. ✅ **Sauvegarde** : Faire une sauvegarde de la base avant l'import
2. ✅ **Test** : Tester d'abord sur un environnement de développement
3. ✅ **Validation** : Vérifier les données après l'import

## 🔄 Mise à Jour des Données

### **Import Incrémental**
Le script peut être exécuté plusieurs fois. Les nouveaux partenaires seront ajoutés avec de nouveaux IDs.

### **Mise à Jour en Lot**
```sql
-- Exemple de mise à jour en lot
UPDATE partenaires 
SET valeur = '750,000 EUR'
WHERE pays = 'France' AND domaine_expertise = 'Ingénierie';
```

## 📞 Support

### **En Cas de Problème**
1. ✅ Vérifier les logs d'erreur
2. ✅ Vérifier la structure de la table
3. ✅ Vérifier la connexion à la base
4. ✅ Vérifier le format du fichier Excel

### **Logs Détaillés**
Le script génère des logs détaillés pour faciliter le diagnostic des problèmes.

---

**Version** : 1.0.0  
**Dernière mise à jour** : Décembre 2024  
**Statut** : ✅ Prêt à l'utilisation
