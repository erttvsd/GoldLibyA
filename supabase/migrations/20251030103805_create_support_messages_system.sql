/*
  # Create Support Messages System
  
  ## Purpose
  Enable buyers to contact suppliers about their purchases through in-app chat.
  Each conversation is tied to a specific asset/purchase.
  
  ## New Tables
  
  ### support_conversations
  Tracks conversations between buyers and suppliers about specific assets
  - id: Unique identifier
  - user_id: Buyer (references profiles)
  - asset_id: The asset being discussed (references owned_assets)
  - store_id: The store/supplier (references stores)
  - subject: Conversation subject (auto-generated based on asset)
  - status: open, resolved, closed
  - last_message_at: Timestamp of most recent message
  
  ### support_messages
  Individual messages within conversations
  - id: Unique identifier
  - conversation_id: Which conversation (references support_conversations)
  - sender_id: Who sent the message (references profiles)
  - sender_type: 'customer' or 'supplier'
  - message: The message text
  - is_read: Whether the message has been read
  - created_at: When the message was sent
  
  ## Security
  - RLS enabled on all tables
  - Users can only see their own conversations
  - Suppliers can see conversations for their stores (future feature)
  
  ## Indexes
  - Optimized for conversation lookup by user, asset, and store
  - Optimized for message retrieval by conversation
*/

-- 1. Create support_conversations table
CREATE TABLE IF NOT EXISTS public.support_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  asset_id uuid REFERENCES public.owned_assets(id) ON DELETE CASCADE,
  store_id uuid REFERENCES public.stores(id) ON DELETE SET NULL,
  subject text NOT NULL,
  status text DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'closed')),
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for conversations
CREATE INDEX IF NOT EXISTS idx_conversations_user ON public.support_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_asset ON public.support_conversations(asset_id);
CREATE INDEX IF NOT EXISTS idx_conversations_store ON public.support_conversations(store_id);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON public.support_conversations(status);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON public.support_conversations(last_message_at DESC);

-- RLS for conversations
ALTER TABLE public.support_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
  ON public.support_conversations FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create own conversations"
  ON public.support_conversations FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own conversations"
  ON public.support_conversations FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = user_id)
  WITH CHECK ((SELECT auth.uid()) = user_id);

-- 2. Create support_messages table
CREATE TABLE IF NOT EXISTS public.support_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.support_conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  sender_type text NOT NULL CHECK (sender_type IN ('customer', 'supplier', 'admin')),
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.support_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.support_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.support_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON public.support_messages(is_read) WHERE is_read = false;

-- RLS for messages
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in own conversations"
  ON public.support_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.support_conversations
      WHERE id = conversation_id AND user_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "Users can create messages in own conversations"
  ON public.support_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.support_conversations
      WHERE id = conversation_id AND user_id = (SELECT auth.uid())
    )
    AND sender_id = (SELECT auth.uid())
  );

-- 3. Create function to update last_message_at
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.support_conversations
  SET last_message_at = NEW.created_at,
      updated_at = now()
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trg_update_conversation_last_message ON public.support_messages;
CREATE TRIGGER trg_update_conversation_last_message
  AFTER INSERT ON public.support_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- 4. Create function to get or create conversation
CREATE OR REPLACE FUNCTION get_or_create_conversation(
  p_user_id uuid,
  p_asset_id uuid,
  p_store_id uuid,
  p_subject text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_conversation_id uuid;
BEGIN
  -- Try to find existing conversation
  SELECT id INTO v_conversation_id
  FROM public.support_conversations
  WHERE user_id = p_user_id 
    AND asset_id = p_asset_id
    AND status = 'open'
  LIMIT 1;
  
  -- If not found, create new conversation
  IF v_conversation_id IS NULL THEN
    INSERT INTO public.support_conversations (user_id, asset_id, store_id, subject)
    VALUES (p_user_id, p_asset_id, p_store_id, p_subject)
    RETURNING id INTO v_conversation_id;
  END IF;
  
  RETURN v_conversation_id;
END;
$$;
