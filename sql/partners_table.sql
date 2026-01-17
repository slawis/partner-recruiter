-- =====================================================
-- PARTNER RECRUITER - PARTNERS TABLE
-- Tabela do zarządzania pośrednikami (partnerami)
-- =====================================================

-- 1. Utworzenie tabeli partners
CREATE TABLE IF NOT EXISTS partners (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Dane pośrednika
  name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255),
  company VARCHAR(255),
  nip VARCHAR(20),
  phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,

  -- Status i notatki
  status VARCHAR(50) DEFAULT 'lead',  -- lead, contacted, meeting, converted, rejected
  notes TEXT,
  source VARCHAR(100),  -- cold_call, referral, website, invitation

  -- Kto dodał (do filtrowania)
  created_by UUID,
  created_by_name VARCHAR(255),
  inviter_key VARCHAR(100),  -- klucz doradcy który dodał

  -- Statystyki (denormalizacja dla wydajności)
  invitations_count INTEGER DEFAULT 0,
  meetings_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_contact_at TIMESTAMPTZ
);

-- 2. Indeksy dla wydajności
CREATE INDEX IF NOT EXISTS idx_partners_inviter_key ON partners(inviter_key);
CREATE INDEX IF NOT EXISTS idx_partners_status ON partners(status);
CREATE INDEX IF NOT EXISTS idx_partners_created_by ON partners(created_by);
CREATE INDEX IF NOT EXISTS idx_partners_phone ON partners(phone);
CREATE INDEX IF NOT EXISTS idx_partners_email ON partners(email);

-- 3. Row Level Security
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;

-- 4. Usuń istniejące policies jeśli istnieją (dla bezpiecznej reinstalacji)
DROP POLICY IF EXISTS "partners_select" ON partners;
DROP POLICY IF EXISTS "partners_insert" ON partners;
DROP POLICY IF EXISTS "partners_update" ON partners;
DROP POLICY IF EXISTS "partners_delete" ON partners;

-- 5. Nowe policies (uproszczone dla MVP - filtrowanie po stronie aplikacji)
-- W produkcji można zmienić na bardziej restrykcyjne:
-- CREATE POLICY "partners_select" ON partners FOR SELECT USING (
--   inviter_key = (SELECT inviter_key FROM user_profiles WHERE id = auth.uid())
--   OR
--   (SELECT role FROM user_profiles WHERE id = auth.uid()) = 'admin'
-- );

CREATE POLICY "partners_select" ON partners FOR SELECT USING (true);
CREATE POLICY "partners_insert" ON partners FOR INSERT WITH CHECK (true);
CREATE POLICY "partners_update" ON partners FOR UPDATE USING (true);
CREATE POLICY "partners_delete" ON partners FOR DELETE USING (true);

-- 6. Trigger do automatycznej aktualizacji updated_at
CREATE OR REPLACE FUNCTION update_partners_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_partners_updated_at ON partners;
CREATE TRIGGER trigger_partners_updated_at
  BEFORE UPDATE ON partners
  FOR EACH ROW
  EXECUTE FUNCTION update_partners_updated_at();
