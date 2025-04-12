/*
  # Create documents and recipients tables

  1. New Tables
    - `documents`
      - `id` (uuid, primary key)
      - `name` (text)
      - `content` (bytea) - PDF content
      - `sender_id` (uuid) - References auth.users
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `document_recipients`
      - `id` (uuid, primary key)
      - `document_id` (uuid) - References documents
      - `email` (text)
      - `status` (text) - pending/signed/declined
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for document access
    - Add policies for recipient access
*/

-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  content bytea NOT NULL,
  sender_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create document_recipients table
CREATE TABLE IF NOT EXISTS document_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'declined')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_recipients ENABLE ROW LEVEL SECURITY;

-- Create policies for documents
CREATE POLICY "Users can insert their own documents"
  ON documents
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can view their own documents"
  ON documents
  FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id);

-- Create policies for document_recipients
CREATE POLICY "Users can insert recipients for their documents"
  ON document_recipients
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_id
      AND documents.sender_id = auth.uid()
    )
  );

CREATE POLICY "Users can view recipients for their documents"
  ON document_recipients
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM documents
      WHERE documents.id = document_id
      AND documents.sender_id = auth.uid()
    )
  );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_document_recipients_updated_at
  BEFORE UPDATE ON document_recipients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();