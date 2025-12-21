import { supabase, supabaseConnected } from './supabase-client.js';

/**
 * Multiplayer model using Supabase
 * Provides persistence for multiplayer sessions and messages
 */
class MultiplayerModel {
  /**
   * Create or get a multiplayer session
   */
  static async createOrGetSession(sessionId, title = null) {
    if (!supabaseConnected || !supabase) {
      return null;
    }

    try {
      // Check if session exists
      const { data: existing } = await supabase
        .from('multiplayer_sessions')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (existing) {
        return existing;
      }

      // Create new session
      const { data, error } = await supabase
        .from('multiplayer_sessions')
        .insert({
          session_id: sessionId,
          title: title || `Multiplayer Session ${sessionId}`,
          participant_count: 0,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          // Unique constraint violation - session already exists
          const { data: existing2 } = await supabase
            .from('multiplayer_sessions')
            .select('*')
            .eq('session_id', sessionId)
            .single();
          return existing2;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('❌ Supabase createOrGetSession error:', error.message);
      return null;
    }
  }

  /**
   * Update session participant count
   */
  static async updateParticipantCount(sessionId, count) {
    if (!supabaseConnected || !supabase) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('multiplayer_sessions')
        .update({
          participant_count: count,
          last_activity: new Date().toISOString()
        })
        .eq('session_id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Supabase updateParticipantCount error:', error.message);
      return null;
    }
  }

  /**
   * Add a multiplayer message
   */
  static async addMessage(sessionId, sender, content, messageType = 'chat', questionNumber = null, imageData = null, imageUrl = null, imageType = null) {
    if (!supabaseConnected || !supabase) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('multiplayer_messages')
        .insert({
          session_id: sessionId,
          sender: sender,
          content: content,
          message_type: messageType,
          question_number: questionNumber,
          image_data: imageData,
          image_url: imageUrl,
          image_type: imageType
        })
        .select()
        .single();

      if (error) throw error;

      // Update session activity
      await supabase
        .from('multiplayer_sessions')
        .update({ last_activity: new Date().toISOString() })
        .eq('session_id', sessionId);

      return data;
    } catch (error) {
      console.error('❌ Supabase addMessage error:', error.message);
      return null;
    }
  }

  /**
   * Get messages for a session
   */
  static async getMessages(sessionId, limit = 100, offset = 0) {
    if (!supabaseConnected || !supabase) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('multiplayer_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('timestamp', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      // Map to match SQLite format
      return (data || []).map(msg => ({
        id: msg.id,
        session_id: msg.session_id,
        sender: msg.sender,
        content: msg.content,
        message_type: msg.message_type,
        question_number: msg.question_number,
        timestamp: msg.timestamp,
        image_data: msg.image_data,
        image_url: msg.image_url,
        image_type: msg.image_type
      }));
    } catch (error) {
      console.error('❌ Supabase getMessages error:', error.message);
      return [];
    }
  }

  /**
   * Deactivate a session
   */
  static async deactivateSession(sessionId) {
    if (!supabaseConnected || !supabase) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('multiplayer_sessions')
        .update({ is_active: false })
        .eq('session_id', sessionId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Supabase deactivateSession error:', error.message);
      return null;
    }
  }

  /**
   * Get active sessions
   */
  static async getActiveSessions(limit = 20, offset = 0) {
    if (!supabaseConnected || !supabase) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('multiplayer_sessions')
        .select('*')
        .eq('is_active', true)
        .order('last_activity', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('❌ Supabase getActiveSessions error:', error.message);
      return [];
    }
  }
}

export default MultiplayerModel;

