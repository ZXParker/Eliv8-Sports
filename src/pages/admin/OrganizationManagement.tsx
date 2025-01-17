import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Plus, X, AlertCircle, Phone, Mail, MapPin, Globe, CheckCircle2, History } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { useAuthStore } from '@/store/auth';

interface Organization {
  id: string;
  name: string;
  email: string[];
  phone: string[];
  address: string | null;
  website?: string | null;
  last_updated?: string;
}

interface ContactItemProps {
  value: string;
  onRemove: () => void;
  icon: React.ElementType;
  type: 'email' | 'phone';
}

const ContactItem = ({ value, onRemove, icon: Icon, type }: ContactItemProps) => (
  <motion.div
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: 20 }}
    className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/10 backdrop-blur-sm border border-blue-500/20 group hover:bg-blue-500/20 transition-all duration-300"
  >
    <Icon className="h-4 w-4 text-blue-400" />
    <a 
      href={type === 'email' ? `mailto:${value}` : `tel:${value}`}
      className="flex-1 text-gray-200 text-sm hover:text-blue-400 transition-colors"
    >
      {value}
    </a>
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={onRemove}
      className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-300"
    >
      <X className="h-4 w-4" />
    </Button>
  </motion.div>
);

const formatPhoneNumber = (phone: string) => {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  // Format based on length
  if (cleaned.length === 10) {
    return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  } else if (cleaned.length === 11) {
    return cleaned.replace(/(\d{1})(\d{3})(\d{3})(\d{4})/, '+$1 ($2) $3-$4');
  }
  return phone;
};

export default function OrganizationManagement() {
  const { user } = useAuthStore();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [name, setName] = useState('');
  const [emails, setEmails] = useState<string[]>([]);
  const [phones, setPhones] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [address, setAddress] = useState('');
  const [website, setWebsite] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchOrganization();
    }
  }, [user]);

  const fetchOrganization = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user?.id)
        .single();

      if (profile?.organization_id) {
        const { data: org, error } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', profile.organization_id)
          .single();

        if (error) throw error;

        if (org) {
          setOrganization(org);
          setName(org.name);
          setEmails(org.email || []);
          setPhones(org.phone || []);
          setAddress(org.address || '');
          setWebsite(org.website || '');
        }
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
      toast({
        title: "Error",
        description: "Failed to load organization details",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  const validatePhone = (phone: string) => {
    // Allow various phone formats including international
    const phoneRegex = /^(?:\+?\d{1,3}[-. ]?)?\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  };

  const validateWebsite = (url: string) => {
    if (!url) return true; // Optional field
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      return true;
    } catch {
      return false;
    }
  };

  const handleAddEmail = () => {
    const trimmedEmail = newEmail.trim();
    if (!trimmedEmail || !validateEmail(trimmedEmail)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    if (emails.includes(trimmedEmail)) {
      toast({
        title: "Duplicate Email",
        description: "This email is already added",
        variant: "destructive",
      });
      return;
    }

    setEmails([...emails, trimmedEmail]);
    setNewEmail('');
  };

  const handleAddPhone = () => {
    const trimmedPhone = newPhone.trim();
    if (!trimmedPhone || !validatePhone(trimmedPhone)) {
      toast({
        title: "Invalid Phone",
        description: "Please enter a valid phone number",
        variant: "destructive",
      });
      return;
    }

    const formattedPhone = formatPhoneNumber(trimmedPhone);
    if (phones.includes(formattedPhone)) {
      toast({
        title: "Duplicate Phone",
        description: "This phone number is already added",
        variant: "destructive",
      });
      return;
    }

    setPhones([...phones, formattedPhone]);
    setNewPhone('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (!name.trim()) {
        throw new Error('Organization name is required');
      }

      if (!validateWebsite(website)) {
        throw new Error('Please enter a valid website URL');
      }

      const updates = {
        name: name.trim(),
        email: emails,
        phone: phones,
        address: address.trim() || null,
        website: website.trim() || null,
        updated_at: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', organization?.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Organization updated successfully",
      });
      
      await fetchOrganization();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] space-y-4">
        <LoadingSpinner size="lg" className="text-primary" />
        <p className="text-muted-foreground animate-pulse">Loading organization details...</p>
      </div>
    );
  }

  return (
    <div className="relative space-y-8">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl animate-pulse delay-700" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative text-center space-y-4"
      >
        <h1 className="text-4xl font-bold text-white">Organization Management</h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Manage your organization's contact information and details
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="relative bg-black/40 backdrop-blur-xl border border-blue-500/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" />
                Organization Details
              </div>
              {organization?.last_updated && (
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <History className="w-4 h-4" />
                  Last updated: {new Date(organization.last_updated).toLocaleDateString()}
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6"
                >
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-gray-400">Organization Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="bg-blue-500/10 border-blue-500/20 text-white placeholder-gray-500"
                  placeholder="Enter organization name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website" className="text-gray-400">Website</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="website"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="pl-10 bg-blue-500/10 border-blue-500/20 text-white placeholder-gray-500"
                    placeholder="Enter organization website"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-gray-400">Email Addresses</Label>
                <div className="space-y-3">
                  <AnimatePresence>
                    {emails.map((email) => (
                      <ContactItem
                        key={email}
                        value={email}
                        onRemove={() => setEmails(emails.filter(e => e !== email))}
                        icon={Mail}
                        type="email"
                      />
                    ))}
                  </AnimatePresence>

                  <div className="flex gap-2">
                    <Input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddEmail()}
                      placeholder="Add new email"
                      className="flex-1 bg-blue-500/10 border-blue-500/20 text-white placeholder-gray-500"
                    />
                    <Button
                      type="button"
                      onClick={handleAddEmail}
                      disabled={!newEmail}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Email
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-gray-400">Phone Numbers</Label>
                <div className="space-y-3">
                  <AnimatePresence>
                    {phones.map((phone) => (
                      <ContactItem
                        key={phone}
                        value={phone}
                        onRemove={() => setPhones(phones.filter(p => p !== phone))}
                        icon={Phone}
                        type="phone"
                      />
                    ))}
                  </AnimatePresence>

                  <div className="flex gap-2">
                    <Input
                      type="tel"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddPhone()}
                      placeholder="Add new phone number"
                      className="flex-1 bg-blue-500/10 border-blue-500/20 text-white placeholder-gray-500"
                    />
                    <Button
                      type="button"
                      onClick={handleAddPhone}
                      disabled={!newPhone}
                      className="bg-blue-500 hover:bg-blue-600 text-white"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Phone
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address" className="text-gray-400">Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Textarea
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="pl-10 bg-blue-500/10 border-blue-500/20 text-white placeholder-gray-500"
                    placeholder="Enter organization address"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-blue-500/20">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => fetchOrganization()}
                  disabled={saving}
                  className="text-gray-400 hover:text-white hover:bg-blue-500/10"
                >
                  <History className="h-4 w-4 mr-2" />
                  Reset Changes
                </Button>

                <Button
                  type="submit"
                  className="min-w-[200px] bg-blue-500 hover:bg-blue-600 text-white font-medium"
                  disabled={saving}
                >
                  {saving ? (
                    <div className="flex items-center gap-2">
                      <LoadingSpinner size="sm" />
                      <span>Saving Changes...</span>
                    </div>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Save Changes
                    </span>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      {/* Success Message */}
      <AnimatePresence>
        {saving === false && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed bottom-8 right-8"
          >
            <Alert className="bg-emerald-500/20 border-emerald-500/20">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <AlertDescription className="text-emerald-400">
                All changes saved successfully
              </AlertDescription>
            </Alert>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}