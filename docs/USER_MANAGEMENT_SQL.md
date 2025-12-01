# PostgreSQL User Management SQL Queries

Comprehensive SQL query reference for managing users in the Hono backend.

## Database Schema Overview

**Table:** `users`
- `id` (UUID, primary key)
- `name` (text, nullable)
- `email` (text, unique)
- `emailVerified` (boolean, default false)
- `image` (text, nullable)
- `role` (enum: USER, ADMIN, MODERATOR)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

**Related Tables:**
- `sessions` (cascade delete on user deletion)
- `accounts` (cascade delete on user deletion)

---

## FETCH QUERIES (SELECT)

### 1. Tüm Kullanıcıları Listele

```sql
-- Basit liste
SELECT * FROM users;

-- Daha okunabilir (sütunları özelleştir)
SELECT
    id,
    name,
    email,
    role,
    "emailVerified",
    "createdAt"
FROM users
ORDER BY "createdAt" DESC;

-- Sayfa sayfa (pagination)
SELECT * FROM users
ORDER BY "createdAt" DESC
LIMIT 20 OFFSET 0;

-- İstatistiklerle birlikte (session ve account sayıları)
SELECT
    u.id,
    u.name,
    u.email,
    u.role,
    COUNT(DISTINCT s.id) as session_count,
    COUNT(DISTINCT a.id) as account_count
FROM users u
LEFT JOIN sessions s ON u.id = s."userId"
LEFT JOIN accounts a ON u.id = a."userId"
GROUP BY u.id
ORDER BY u."createdAt" DESC;
```

### 2. ID'ye Göre Kullanıcı Getir

```sql
-- Tek kullanıcı
SELECT * FROM users
WHERE id = 'user-uuid-here';

-- İlişkili verilerle birlikte
SELECT
    u.*,
    json_agg(DISTINCT s.*) FILTER (WHERE s.id IS NOT NULL) as sessions,
    json_agg(DISTINCT a.*) FILTER (WHERE a.id IS NOT NULL) as accounts
FROM users u
LEFT JOIN sessions s ON u.id = s."userId"
LEFT JOIN accounts a ON u.id = a."userId"
WHERE u.id = 'user-uuid-here'
GROUP BY u.id;
```

### 3. Email'e Göre Kullanıcı Getir

```sql
-- Tam eşleşme
SELECT * FROM users
WHERE email = 'user@example.com';

-- Case-insensitive arama
SELECT * FROM users
WHERE LOWER(email) = LOWER('user@example.com');

-- Email içeren (LIKE)
SELECT * FROM users
WHERE email ILIKE '%@example.com%';
```

### 4. Role Göre Filtrele

```sql
-- ADMIN kullanıcıları
SELECT * FROM users
WHERE role = 'ADMIN'
ORDER BY "createdAt" DESC;

-- MODERATOR veya ADMIN
SELECT * FROM users
WHERE role IN ('ADMIN', 'MODERATOR')
ORDER BY role, "createdAt" DESC;

-- USER olmayan tüm kullanıcılar
SELECT * FROM users
WHERE role != 'USER';

-- Role göre sayı
SELECT
    role,
    COUNT(*) as user_count
FROM users
GROUP BY role
ORDER BY user_count DESC;
```

### 5. Ek Faydalı Sorgular

```sql
-- Email doğrulamış kullanıcılar
SELECT * FROM users
WHERE "emailVerified" = true;

-- Email doğrulamamış kullanıcılar
SELECT * FROM users
WHERE "emailVerified" = false
ORDER BY "createdAt" DESC;

-- Son 7 günde kayıt olanlar
SELECT * FROM users
WHERE "createdAt" >= NOW() - INTERVAL '7 days'
ORDER BY "createdAt" DESC;

-- Aktif session'ı olan kullanıcılar
SELECT DISTINCT u.*
FROM users u
INNER JOIN sessions s ON u.id = s."userId"
WHERE s."expiresAt" > NOW();

-- Google OAuth ile giriş yapmış kullanıcılar
SELECT DISTINCT u.*
FROM users u
INNER JOIN accounts a ON u.id = a."userId"
WHERE a."providerId" = 'google';
```

---

## DELETE QUERIES

### ⚠️ ÖNEMLİ UYARILAR

1. **DELETE işlemleri GERİ ALINAMAZ!**
2. Production ortamında DELETE çalıştırmadan önce mutlaka backup alın
3. İlk önce SELECT ile sorguyu test edin
4. CASCADE delete: User silindiğinde sessions ve accounts otomatik silinir

### 1. ID'ye Göre Sil

```sql
-- Önce kullanıcıyı kontrol et
SELECT * FROM users WHERE id = 'user-uuid-here';

-- Silme işlemi
DELETE FROM users
WHERE id = 'user-uuid-here';

-- Silinen kayıt sayısını göster
DELETE FROM users
WHERE id = 'user-uuid-here'
RETURNING *;
```

### 2. Email'e Göre Sil

```sql
-- Önce kullanıcıyı kontrol et
SELECT * FROM users WHERE email = 'user@example.com';

-- Silme işlemi
DELETE FROM users
WHERE email = 'user@example.com';

-- Silinen kaydı göster
DELETE FROM users
WHERE email = 'user@example.com'
RETURNING id, name, email, role;
```

### 3. Role Göre Toplu Sil

```sql
-- ⚠️ ÇOK DİKKATLİ! Önce kaç kayıt silineceğini kontrol et
SELECT COUNT(*) FROM users WHERE role = 'USER';

-- USER rolündeki tüm kullanıcıları sil
DELETE FROM users
WHERE role = 'USER';

-- MODERATOR rolündeki kullanıcıları sil
DELETE FROM users
WHERE role = 'MODERATOR'
RETURNING id, name, email;
```

### 4. Tüm Kullanıcıları Sil

```sql
-- ⚠️⚠️⚠️ SON DERECE TEHLİKELİ! ⚠️⚠️⚠️
-- Production'da ASLA kullanma!
-- Development/test ortamları için

-- Önce toplam kullanıcı sayısını kontrol et
SELECT COUNT(*) FROM users;

-- TÜM kullanıcıları sil (sessions ve accounts da silinir)
DELETE FROM users;

-- İlgili tüm tabloları temizle
TRUNCATE users, sessions, accounts, verifications CASCADE;
```

### 5. Koşullu Silme İşlemleri

```sql
-- Email doğrulamamış ve 30 günden eski kullanıcıları sil
DELETE FROM users
WHERE "emailVerified" = false
  AND "createdAt" < NOW() - INTERVAL '30 days'
RETURNING id, email, "createdAt";

-- Hiç session'ı olmamış kullanıcıları sil
DELETE FROM users
WHERE id NOT IN (SELECT DISTINCT "userId" FROM sessions);

-- Silinmeden önce sayıyı göster
WITH to_delete AS (
  SELECT id FROM users
  WHERE "emailVerified" = false
    AND "createdAt" < NOW() - INTERVAL '30 days'
)
SELECT COUNT(*) FROM to_delete;

-- Sonra sil
DELETE FROM users
WHERE "emailVerified" = false
  AND "createdAt" < NOW() - INTERVAL '30 days';
```

---

## GÜVENLE KULLANIM ÖNERİLERİ

### 1. Transaction Kullanımı

```sql
-- Transaction başlat
BEGIN;

-- Silme işlemini yap
DELETE FROM users WHERE id = 'user-uuid-here';

-- Kontrol et, sorun yoksa commit
COMMIT;

-- Sorun varsa geri al
-- ROLLBACK;
```

### 2. Backup Almak

```sql
-- Silmeden önce backup tablosu oluştur
CREATE TABLE users_backup AS
SELECT * FROM users;

-- Belirli kullanıcıları backup'la
CREATE TABLE users_backup_20250101 AS
SELECT * FROM users
WHERE role = 'USER';

-- Silme işleminden sonra backup'ı kontrol et
SELECT COUNT(*) FROM users_backup;
```

### 3. Soft Delete (Önerilen)

```sql
-- users tablosuna deleted_at kolonu ekle (migration gerekli)
-- ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP;

-- Silmek yerine işaretle
UPDATE users
SET deleted_at = NOW()
WHERE id = 'user-uuid-here';

-- Silinmemiş kullanıcıları getir
SELECT * FROM users
WHERE deleted_at IS NULL;

-- Silinen kullanıcıları getir
SELECT * FROM users
WHERE deleted_at IS NOT NULL;
```

---

## PSQL'DE KULLANIM

```bash
# PostgreSQL'e bağlan
psql postgresql://postgres:postgres@localhost:5432/hono_template

# Veya
psql -h localhost -U postgres -d hono_template

# Sorguları çalıştır
\x  # Expanded display (daha okunabilir)
SELECT * FROM users LIMIT 5;

# CSV olarak export et
\copy (SELECT * FROM users) TO '/tmp/users.csv' CSV HEADER

# Transaction kullan
BEGIN;
DELETE FROM users WHERE id = 'uuid';
SELECT * FROM users WHERE id = 'uuid';  -- Kontrol et
COMMIT;  -- veya ROLLBACK;
```

---

## ÖZET

### Güvenli Kullanım Checklist:

- [ ] Production'da çalışıyorsan backup aldın mı?
- [ ] DELETE öncesi SELECT ile kontrol ettin mi?
- [ ] Transaction kullanıyor musun?
- [ ] CASCADE delete'in ne sileceğini biliyor musun?
- [ ] RETURNING clause ile silinen kayıtları görüntüleyecek misin?
- [ ] WHERE clause yazmayı unutmadın mı? (tüm kayıtlar silinir!)

### En Sık Kullanılan Sorgular:

```sql
-- Tüm kullanıcılar
SELECT * FROM users ORDER BY "createdAt" DESC;

-- Belirli kullanıcı
SELECT * FROM users WHERE email = 'user@example.com';

-- Kullanıcı sil (güvenli)
BEGIN;
DELETE FROM users WHERE id = 'uuid' RETURNING *;
COMMIT;
```
