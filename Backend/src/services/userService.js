const supabase = require('../config/supabase');
const ApiError = require('../utils/ApiError');

const getUserById = async (userId) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, role, created_at, updated_at')
    .eq('id', userId)
    .single();
  if (error || !data) throw ApiError.notFound('User not found');
  return { _id: data.id, name: data.name, email: data.email, role: data.role, createdAt: data.created_at, updatedAt: data.updated_at };
};

const updateProfile = async (userId, { name }) => {
  const { data, error } = await supabase
    .from('users')
    .update({ name: name.trim() })
    .eq('id', userId)
    .select('id, name, email, role, created_at, updated_at')
    .single();
  if (error || !data) throw ApiError.notFound('User not found');
  return { _id: data.id, name: data.name, email: data.email, role: data.role, createdAt: data.created_at, updatedAt: data.updated_at };
};

const getDashboardStats = async (userId) => {
  const [recRes, trRes, highRiskRes, financeRes] = await Promise.all([
    supabase.from('recordings').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('transcripts').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    supabase.from('transcripts').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'done').eq('insights->>risk_level', 'high'),
    supabase.from('transcripts').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'done').eq('insights->>finance_detected', 'true'),
  ]);

  return {
    totalRecordings: recRes.count || 0,
    totalTranscripts: trRes.count || 0,
    highRiskCount: highRiskRes.count || 0,
    financeCount: financeRes.count || 0,
  };
};

module.exports = { getUserById, updateProfile, getDashboardStats };
