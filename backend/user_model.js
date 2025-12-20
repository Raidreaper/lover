import { supabase, supabaseConnected } from './supabase-client.js';

/**
 * User model using Supabase
 * Provides the same interface as the old Mongoose model for easy migration
 */
class UserModel {
  /**
   * Find a user by username
   */
  static async findOne(query) {
    if (!supabaseConnected || !supabase) {
      return null;
    }

    try {
      let queryBuilder = supabase.from('users').select('*');
      
      if (query.username) {
        queryBuilder = queryBuilder.eq('username', query.username);
      }
      if (query.email) {
        queryBuilder = queryBuilder.eq('email', query.email);
      }
      if (query.id) {
        queryBuilder = queryBuilder.eq('id', query.id);
      }

      const { data, error } = await queryBuilder.single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        throw error;
      }

      return data ? this._mapToUser(data) : null;
    } catch (error) {
      console.error('❌ Supabase user findOne error:', error.message);
      return null;
    }
  }

  /**
   * Find a user by ID
   */
  static async findById(id) {
    if (!supabaseConnected || !supabase) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data ? this._mapToUser(data) : null;
    } catch (error) {
      console.error('❌ Supabase user findById error:', error.message);
      return null;
    }
  }

  /**
   * Create a new user
   */
  static async create(userData) {
    if (!supabaseConnected || !supabase) {
      throw new Error('Supabase not connected');
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .insert({
          username: userData.username,
          email: userData.email,
          password_hash: userData.password,
          is_active: userData.isActive !== false
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          // Unique constraint violation
          throw new Error('Username or email already exists');
        }
        throw error;
      }

      return this._mapToUser(data);
    } catch (error) {
      console.error('❌ Supabase user create error:', error.message);
      throw error;
    }
  }

  /**
   * Update user's last login
   */
  static async updateLastLogin(userId) {
    if (!supabaseConnected || !supabase) {
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data ? this._mapToUser(data) : null;
    } catch (error) {
      console.error('❌ Supabase updateLastLogin error:', error.message);
      return null;
    }
  }

  /**
   * Map Supabase user data to Mongoose-like format for compatibility
   */
  static _mapToUser(data) {
    return {
      _id: data.id,
      id: data.id,
      username: data.username,
      email: data.email,
      password: data.password_hash,
      createdAt: data.created_at,
      lastLogin: data.last_login,
      isActive: data.is_active,
      // Mongoose-like methods for compatibility
      save: async () => {
        // For compatibility, but updates should use direct Supabase calls
        return this;
      }
    };
  }
}

// Export as default for compatibility with old code
export default UserModel;
