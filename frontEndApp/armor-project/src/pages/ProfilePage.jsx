import React, { useState, useEffect } from 'react';
import {
  User, MapPin, Mail, Wallet, CreditCard, Landmark,
  Phone, Save, Edit3, X, LogOut, Loader, Shield,
} from 'lucide-react';
import { getMyProfile, updateProfile } from '../api/users';
import LogoutModal from '../components/LogoutModal';

const cs = { background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:18, padding:'24px 26px', boxShadow:'var(--shadow-sm)', transition:'all 0.2s ease' };
const ib = { background:'var(--bg-input)', border:'1px solid var(--border)', borderRadius:11, padding:'10px 14px', fontSize:13, fontFamily:'inherit', color:'var(--text-primary)', outline:'none', width:'100%', boxSizing:'border-box', transition:'border-color 0.2s' };
const lbl = { display:'block', fontSize:11, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', marginBottom:6 };

const SnapshotItem = ({ icon: Icon, label, value }) => (
  <div style={{ background:'var(--bg-subtle)', border:'1px solid var(--border)', borderRadius:14, padding:'14px 16px' }}>
    <div style={{ fontSize:10, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.5px', display:'flex', alignItems:'center', gap:5, marginBottom:8 }}>
      <Icon size={11} /> {label}
    </div>
    <div style={{ fontSize:14, fontWeight:700, color:'var(--text-primary)' }}>{value || 'Not specified'}</div>
  </div>
);

const Profile = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [showLogout, setShowLogout] = useState(false);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saveMsg, setSaveMsg]   = useState('');

  const empty = { name:'', email:'', country:'', state:'', city:'', monthlySalary:'', hasEmi:'no', emiAmount:'', totalPropertiesValue:'', mobileNumber:'' };
  const [profile, setProfile]   = useState(empty);
  const [formData, setFormData] = useState(empty);

  useEffect(() => {
    getMyProfile()
      .then(data => {
        const u = data.user ?? data;
        const merged = { ...empty, ...Object.fromEntries(Object.keys(empty).map(k => [k, u[k] ?? ''])) };
        merged.hasEmi = u.hasEmi ?? 'no';
        setProfile(merged); setFormData(merged);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleChange = e => setFormData(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = async e => {
    e.preventDefault();
    setSaving(true); setSaveMsg('');
    try {
      const data = await updateProfile({ name: formData.name });
      const u = data.user ?? data;
      const updated = { ...formData, name: u.name ?? formData.name, email: u.email ?? formData.email };
      setProfile(updated); setFormData(updated);
      setIsEditing(false); setSaveMsg('saved');
      setTimeout(() => setSaveMsg(''), 3000);
    } catch (err) { setSaveMsg(err.message || 'Save failed.'); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:80, gap:12, flexDirection:'column', color:'var(--text-muted)' }}>
      <Loader size={20} style={{ animation:'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <span style={{ fontSize:13, fontWeight:600 }}>Loading profile…</span>
    </div>
  );

  return (
    <>
      <div style={{ display:'flex', flexDirection:'column', gap:18, maxWidth:760, margin:'0 auto', color:'var(--text-primary)' }}>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

        {/* Profile header */}
        <div style={{ ...cs, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <div style={{ width:64, height:64, borderRadius:'50%', background:'var(--green-bg)', border:'2px solid var(--green-border)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <User size={28} color="var(--green)" />
            </div>
            <div>
              <div style={{ fontSize:22, fontWeight:900, letterSpacing:-0.8, marginBottom:4 }}>{profile.name || 'Armor User'}</div>
              <div style={{ display:'flex', gap:14, flexWrap:'wrap', fontSize:12, color:'var(--text-muted)', fontWeight:600 }}>
                <span style={{ display:'flex', alignItems:'center', gap:5 }}><Mail size={12} /> {profile.email || '—'}</span>
                {profile.mobileNumber && <span style={{ display:'flex', alignItems:'center', gap:5 }}><Phone size={12} /> {profile.mobileNumber}</span>}
              </div>
            </div>
          </div>
          {!isEditing && (
            <button onClick={() => { setFormData({...profile}); setIsEditing(true); setSaveMsg(''); }}
              style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:700, color:'var(--green)', background:'var(--green-bg)', border:'1px solid var(--green-border)', borderRadius:11, padding:'9px 18px', cursor:'pointer' }}>
              <Edit3 size={14} /> Edit Profile
            </button>
          )}
        </div>

        {/* Save success */}
        {saveMsg === 'saved' && (
          <div style={{ background:'rgba(5,150,105,0.08)', border:'1px solid rgba(5,150,105,0.2)', color:'var(--accent-green)', borderRadius:12, padding:'10px 18px', fontSize:13, fontWeight:600 }}>
            ✓ Profile saved successfully.
          </div>
        )}

        {/* Edit form */}
        {isEditing && (
          <div style={cs}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20, paddingBottom:16, borderBottom:'1px solid var(--border)' }}>
              <div style={{ fontSize:15, fontWeight:800 }}>Edit Profile</div>
              <button onClick={() => setIsEditing(false)} style={{ width:30, height:30, borderRadius:8, background:'var(--bg-subtle)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', color:'var(--text-muted)' }}>
                <X size={14} />
              </button>
            </div>

            {saveMsg && saveMsg !== 'saved' && (
              <div style={{ background:'rgba(220,38,38,0.08)', border:'1px solid rgba(220,38,38,0.2)', color:'var(--accent-red)', borderRadius:10, padding:'10px 14px', fontSize:13, fontWeight:600, marginBottom:16 }}>
                {saveMsg}
              </div>
            )}

            <form onSubmit={handleSave}>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                <div>
                  <label style={lbl}><User size={10} style={{ display:'inline', marginRight:4 }} />Full Name</label>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} required disabled={saving} style={ib} />
                </div>
                <div>
                  <label style={lbl}><Mail size={10} style={{ display:'inline', marginRight:4 }} />Email (read only)</label>
                  <input type="email" value={formData.email} disabled style={{ ...ib, opacity:0.5, cursor:'not-allowed' }} />
                </div>
                <div>
                  <label style={lbl}><Phone size={10} style={{ display:'inline', marginRight:4 }} />Mobile</label>
                  <input type="tel" name="mobileNumber" value={formData.mobileNumber} onChange={handleChange} placeholder="+91 98765 43210" disabled={saving} style={ib} />
                </div>

                {/* Location */}
                <div style={{ gridColumn:'1/-1', background:'var(--bg-subtle)', borderRadius:14, border:'1px solid var(--border)', padding:'16px' }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'var(--text-secondary)', display:'flex', alignItems:'center', gap:6, marginBottom:12 }}>
                    <MapPin size={13} /> Location
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10 }}>
                    {['country','state','city'].map(f => (
                      <input key={f} type="text" name={f} value={formData[f]} onChange={handleChange} placeholder={f.charAt(0).toUpperCase()+f.slice(1)} disabled={saving} style={ib} />
                    ))}
                  </div>
                </div>

                {/* Financial */}
                <div style={{ gridColumn:'1/-1' }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'var(--text-secondary)', display:'flex', alignItems:'center', gap:6, marginBottom:12 }}>
                    <Wallet size={13} /> Financial Overview
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    <div>
                      <label style={lbl}>Monthly Salary (₹)</label>
                      <input type="number" name="monthlySalary" value={formData.monthlySalary} onChange={handleChange} placeholder="50000" disabled={saving} style={ib} />
                    </div>
                    <div>
                      <label style={lbl}><Landmark size={10} style={{ display:'inline', marginRight:4 }} />Total Assets (₹)</label>
                      <input type="number" name="totalPropertiesValue" value={formData.totalPropertiesValue} onChange={handleChange} placeholder="Combined value" disabled={saving} style={ib} />
                    </div>
                  </div>
                </div>

                {/* EMI */}
                <div style={{ gridColumn:'1/-1', background:'var(--bg-subtle)', borderRadius:14, border:'1px solid var(--border)', padding:'16px' }}>
                  <div style={{ fontSize:12, fontWeight:700, color:'var(--text-secondary)', display:'flex', alignItems:'center', gap:6, marginBottom:12 }}>
                    <CreditCard size={13} /> EMI
                  </div>
                  <div style={{ display:'flex', gap:20, marginBottom:12 }}>
                    {['yes','no'].map(v => (
                      <label key={v} style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, fontWeight:600, color:'var(--text-secondary)' }}>
                        <input type="radio" name="hasEmi" value={v} checked={formData.hasEmi===v} onChange={handleChange} disabled={saving} />
                        {v === 'yes' ? 'Yes, I pay EMI' : 'No EMI'}
                      </label>
                    ))}
                  </div>
                  {formData.hasEmi === 'yes' && (
                    <input type="number" name="emiAmount" value={formData.emiAmount} onChange={handleChange} placeholder="EMI amount per month" disabled={saving} style={{ ...ib, maxWidth:220 }} />
                  )}
                </div>
              </div>

              <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:20, paddingTop:16, borderTop:'1px solid var(--border)' }}>
                <button type="button" onClick={() => setIsEditing(false)} disabled={saving}
                  style={{ fontSize:13, fontWeight:700, color:'var(--text-muted)', background:'var(--bg-subtle)', border:'1px solid var(--border)', borderRadius:10, padding:'9px 18px', cursor:'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  style={{ display:'flex', alignItems:'center', gap:6, fontSize:13, fontWeight:700, color:'var(--text-inverse)', background: saving ? 'var(--text-faint)' : 'var(--green)', border:'none', borderRadius:10, padding:'9px 22px', cursor: saving ? 'not-allowed' : 'pointer' }}>
                  {saving ? <><Loader size={13} style={{ animation:'spin 1s linear infinite' }} /> Saving…</> : <><Save size={14} /> Save Changes</>}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Financial snapshot */}
        {!isEditing && (
          <div style={cs}>
            <div style={{ fontSize:15, fontWeight:800, marginBottom:16 }}>Financial &amp; Regional Snapshot</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <SnapshotItem icon={MapPin}    label="Location" value={[profile.city, profile.state, profile.country].filter(Boolean).join(', ') || undefined} />
              <SnapshotItem icon={Wallet}    label="Monthly Income" value={profile.monthlySalary ? `₹${parseFloat(profile.monthlySalary).toLocaleString()}/mo` : undefined} />
              <SnapshotItem icon={CreditCard} label="EMI" value={profile.hasEmi==='yes' && profile.emiAmount ? `₹${parseFloat(profile.emiAmount).toLocaleString()}/mo` : profile.hasEmi==='no' ? 'No active EMI' : undefined} />
              <SnapshotItem icon={Landmark}  label="Total Assets" value={profile.totalPropertiesValue ? `₹${parseFloat(profile.totalPropertiesValue).toLocaleString()}` : undefined} />
            </div>
          </div>
        )}

        {/* AI Shield status */}
        <div style={{ ...cs, display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:40, height:40, borderRadius:12, background:'var(--green-bg)', border:'1px solid var(--green-border)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Shield size={18} color="var(--green)" />
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:14, fontWeight:800, marginBottom:2 }}>AI Shield Active</div>
            <div style={{ fontSize:12, color:'var(--text-muted)' }}>All conversations are monitored for financial risks in real time.</div>
          </div>
          <span style={{ fontSize:10, fontWeight:800, background:'var(--green-bg)', color:'var(--green)', border:'1px solid var(--green-border)', borderRadius:8, padding:'4px 10px', letterSpacing:'0.5px' }}>ACTIVE</span>
        </div>

        {/* Sign out */}
        <button onClick={() => setShowLogout(true)}
          style={{ width:'100%', background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:14, padding:'14px', display:'flex', alignItems:'center', justifyContent:'center', gap:10, fontSize:13, fontWeight:700, color:'var(--text-muted)', cursor:'pointer', transition:'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.background='rgba(220,38,38,0.06)'; e.currentTarget.style.color='var(--accent-red)'; e.currentTarget.style.borderColor='rgba(220,38,38,0.2)'; }}
          onMouseLeave={e => { e.currentTarget.style.background='var(--bg-card)'; e.currentTarget.style.color='var(--text-muted)'; e.currentTarget.style.borderColor='var(--border)'; }}>
          <LogOut size={16} /> Sign Out
        </button>
      </div>

      <LogoutModal isOpen={showLogout} onClose={() => setShowLogout(false)} />
    </>
  );
};

export default Profile;


