# 🚀 Guide d'Import Rapide - Partenaires BMS

## ⚡ Import en 3 Étapes

### **Étape 1: Préparer la Base de Données**
```sql
-- Se connecter à PostgreSQL
psql -U postgres -d bms_db

-- Créer la table partenaires
\i scripts/create-partenariat-table.sql
```

### **Étape 2: Configurer la Connexion**
Modifiez le fichier `config.js` si nécessaire :
```javascript
database: {
  host: 'localhost',
  port: 5432,
  database: 'bms_db',
  user: 'postgres',
  password: 'votre_mot_de_passe' // ← Changez ceci
}
```

### **Étape 3: Importer les Données**
```bash
# Avec votre fichier Excel
node import-partenariat.js "chemin/vers/votre/partenariat.xlsx"

# Ou avec le fichier d'exemple
node import-partenariat.js ./partenariat-exemple.xlsx
```

## 📊 Format Requis du Fichier Excel

### **En-têtes Obligatoires (Première Ligne)**
```
NOM DU BUREAU | CONTACT | DOMAINE D'EXPERTISE | PAYS
```

### **En-têtes Optionnels**
```
CABINETS AYANT POSTULE | CONTACTS | MARCHE GAGNE | DUREE | BAILLEUR | VALEUR | MARCHE ATTRIBUE LE
```

### **Exemple de Données**
```
Cabinet ABC    | Jean Dupont | Ingénierie | France | Projet Route | 12 mois | Banque Mondiale | 500,000 EUR | 2024-01-15
```

## 🔧 Résolution des Problèmes Courants

### **Erreur: "Table partenaires n'existe pas"**
```sql
\i scripts/create-partenariat-table.sql
```

### **Erreur: "authentification par mot de passe échouée"**
Modifiez le fichier `config.js` avec vos identifiants PostgreSQL.

### **Erreur: "Champs obligatoires manquants"**
Vérifiez que votre fichier Excel contient bien les colonnes :
- NOM DU BUREAU
- CONTACT  
- DOMAINE D'EXPERTISE
- PAYS

## 📋 Scripts Disponibles

| Script | Description | Usage |
|--------|-------------|-------|
| `create-partenariat-table.sql` | Crée la table dans PostgreSQL | `\i scripts/create-partenariat-table.sql` |
| `import-partenariat.js` | Importe les données Excel | `node import-partenariat.js fichier.xlsx` |
| `create-sample-excel.js` | Crée un fichier d'exemple | `node create-sample-excel.js` |
| `test-db-connection.js` | Teste la connexion à la base | `node test-db-connection.js` |

## 🎯 Commandes Utiles

### **Tester la Connexion**
```bash
node scripts/test-db-connection.js
```

### **Créer un Fichier d'Exemple**
```bash
node scripts/create-sample-excel.js
```

### **Importer vos Données**
```bash
node scripts/import-partenariat.js "C:\Users\User\Desktop\partenariat.xlsx"
```

## ✅ Vérification de l'Import

### **Après l'Import, vérifiez dans PostgreSQL :**
```sql
-- Compter les partenaires
SELECT COUNT(*) FROM partenaires;

-- Voir les derniers ajoutés
SELECT * FROM partenaires ORDER BY date_creation DESC LIMIT 5;

-- Vérifier les pays
SELECT DISTINCT pays FROM partenaires;
```

---

**💡 Conseil** : Commencez toujours par tester avec le fichier d'exemple avant d'importer vos vraies données !

**📞 Support** : Consultez `README_IMPORT_PARTENAIRES.md` pour plus de détails.
