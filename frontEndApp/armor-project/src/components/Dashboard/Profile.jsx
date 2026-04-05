import React, { useState } from 'react';
import { User, MapPin, Mail, Wallet, CreditCard, Landmark, Phone, Save, Edit3, X, LogOut } from 'lucide-react';
import LogoutModal from '../Common/LogoutModal';
import { useApp } from '../../context/AppContext';

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const { profile, setProfile } = useApp();
  const [formData, setFormData] = useState({ ...profile });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = (e) => {
    e.preventDefault();
    setProfile(formData);
    setIsEditing(false);
  };

  return (
    <>
      <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto animation-fade-in text-slate-800">
      
        {/* Profile Header Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300">
          <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
            <div className="flex gap-5 items-center">
              <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
                <User size={32} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight mb-1">{profile.name}</h2>
                <div className="flex gap-4 flex-wrap text-sm font-medium text-slate-500">
                  <span className="flex items-center gap-1.5"><Mail size={14} /> {profile.email}</span>
                  {profile.mobileNumber && <span className="flex items-center gap-1.5"><Phone size={14} /> {profile.mobileNumber}</span>}
                </div>
              </div>
            </div>
            {!isEditing && (
              <button 
                onClick={() => { setFormData({...profile}); setIsEditing(true); }}
                className="bg-[#c7f284] hover:bg-[#bbe47b] text-slate-900 border-none px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-sm text-sm"
              >
                <Edit3 size={16} /> Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Profile Edit Form */}
        {isEditing && (
          <form onSubmit={handleSave} className="bg-white rounded-3xl border border-slate-200 p-8 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
              <h3 className="text-lg font-extrabold text-slate-900">Profile Information</h3>
              <button type="button" onClick={() => setIsEditing(false)} className="w-8 h-8 rounded-full bg-slate-50 hover:bg-slate-100 flex items-center justify-center transition-colors">
                <X size={16} className="text-slate-500" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5"><User size={12} className="inline mr-1" />Full Name</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} required className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-[#c7f284] focus:ring-2 focus:ring-[#c7f284]/20 transition-all" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5"><Mail size={12} className="inline mr-1" />Email <span className="text-slate-400">(Read Only)</span></label>
                <input type="email" value={formData.email} disabled className="w-full bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-400 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5"><Phone size={12} className="inline mr-1" />Mobile</label>
                <input type="tel" name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} placeholder="+91 98765 43210" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#c7f284] focus:ring-2 focus:ring-[#c7f284]/20 transition-all" />
              </div>

              {/* Location */}
              <div className="sm:col-span-2 bg-slate-50 rounded-2xl border border-slate-200 p-5">
                <h4 className="text-sm font-bold text-slate-700 flex items-center gap-1.5 mb-4"><MapPin size={14} /> Location</h4>
                <div className="grid grid-cols-3 gap-3">
                  <input type="text" name="country" value={formData.country} onChange={handleChange} placeholder="Country" className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#c7f284] transition-all" />
                  <input type="text" name="state" value={formData.state} onChange={handleChange} placeholder="State" className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#c7f284] transition-all" />
                  <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="City" className="bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#c7f284] transition-all" />
                </div>
              </div>

              {/* Financial */}
              <div className="sm:col-span-2">
                <h4 className="text-sm font-bold text-slate-700 flex items-center gap-1.5 mb-4"><Wallet size={14} /> Financial Overview</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Monthly Salary (₹)</label>
                    <input type="number" name="monthlySalary" value={formData.monthlySalary} onChange={handleChange} placeholder="50000" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#c7f284] transition-all" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5"><Landmark size={12} className="inline mr-1" />Total Assets</label>
                    <input type="number" name="totalPropertiesValue" value={formData.totalPropertiesValue} onChange={handleChange} placeholder="Combined value" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#c7f284] transition-all" />
                  </div>
                </div>

                <div className="mt-4 bg-slate-50 rounded-2xl border border-slate-200 p-5">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5 mb-3"><CreditCard size={14} /> Do you pay EMI?</label>
                  <div className="flex gap-6 mb-3">
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                      <input type="radio" name="hasEmi" value="yes" checked={formData.hasEmi === 'yes'} onChange={handleChange} className="w-4 h-4" /> Yes
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium">
                      <input type="radio" name="hasEmi" value="no" checked={formData.hasEmi === 'no'} onChange={handleChange} className="w-4 h-4" /> No
                    </label>
                  </div>
                  {formData.hasEmi === 'yes' && (
                    <input type="number" name="emiAmount" value={formData.emiAmount} onChange={handleChange} placeholder="EMI/month" className="w-48 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-[#c7f284] transition-all" />
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
              <button type="button" onClick={() => setIsEditing(false)} className="text-slate-500 font-bold text-sm px-5 py-2.5 hover:text-slate-700 transition-colors">Cancel</button>
              <button type="submit" className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-sm hover:shadow-md transition-all">
                <Save size={16} /> Save
              </button>
            </div>
          </form>
        )}

        {/* Financial Snapshot - Shown when not editing */}
        {!isEditing && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300">
            <h3 className="text-lg font-bold text-slate-900 mb-5">Financial & Regional Snapshot</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-2xl p-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2"><MapPin size={12} /> Location</span>
                <p className="text-sm font-semibold text-slate-900">
                  {profile.city || profile.state || profile.country ? `${profile.city ? profile.city + ', ' : ''}${profile.state ? profile.state + ', ' : ''}${profile.country}` : 'Not Specified'}
                </p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2"><Wallet size={12} /> Income</span>
                <p className="text-sm font-semibold text-slate-900">
                  {profile.monthlySalary ? `₹${parseFloat(profile.monthlySalary).toLocaleString()}/mo` : 'Not Specified'}
                </p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2"><CreditCard size={12} /> EMI</span>
                <p className="text-sm font-semibold text-slate-900">
                  {profile.hasEmi === 'yes' && profile.emiAmount ? `₹${parseFloat(profile.emiAmount).toLocaleString()}/mo` : profile.hasEmi === 'no' ? 'No Active EMI' : 'Not Specified'}
                </p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-2"><Landmark size={12} /> Assets</span>
                <p className="text-sm font-semibold text-slate-900">
                  {profile.totalPropertiesValue ? `₹${parseFloat(profile.totalPropertiesValue).toLocaleString()}` : 'Not Specified'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sign Out Button - At Bottom */}
        <button
          onClick={() => setShowLogout(true)}
          className="w-full bg-white rounded-2xl border border-slate-200 p-4 flex items-center justify-center gap-3 text-slate-500 font-bold text-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all duration-300 cursor-pointer group/logout"
        >
          <LogOut size={16} className="group-hover/logout:text-red-500 transition-colors" />
          Sign Out
        </button>

      </div>

      <LogoutModal isOpen={showLogout} onClose={() => setShowLogout(false)} />
    </>
  );
};

export default Profile;
