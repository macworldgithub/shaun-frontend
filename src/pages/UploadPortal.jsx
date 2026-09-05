import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FileUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { clientsApi } from '../lib/api';
import { documentTypes } from '../constants';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';

export default function UploadPortal() {
  const { token } = useParams();
  const [info, setInfo] = useState(null);
  const [type, setType] = useState('Handover checklist');
  const [file, setFile] = useState(null);
  const [state, setState] = useState('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    clientsApi.uploadLinkInfo(token).then((data) => { setInfo(data); setState('ready'); }).catch(() => setState('error'));
  }, [token]);

  const submit = async (event) => {
    event.preventDefault();
    if (!file) { setMessage('Choose a document first.'); return; }
    try {
      await clientsApi.uploadViaLink(token, file, type);
      setFile(null);
      setState('success');
      setMessage('Your document was received and attached to the delivery record.');
    } catch (error) { setMessage(error?.response?.data?.detail || 'Upload failed.'); }
  };

  if (state === 'loading') return <Page><p>Loading upload link...</p></Page>;
  if (state === 'error') return <Page><AlertTriangle className="mx-auto mb-3 text-amber-600"/><p>This upload link is invalid or expired.</p></Page>;
  if (state === 'success') return <Page><CheckCircle2 className="mx-auto mb-3 text-emerald-600"/><h1 className="font-semibold">Document received</h1><p className="text-sm text-neutral-600 mt-2">{message}</p></Page>;

  return <Page>
    <Card className="border-neutral-200">
      <CardHeader><CardTitle>Upload delivery documents</CardTitle><p className="text-sm text-neutral-500">{info.client_name}{info.vehicle ? ` · ${info.vehicle}` : ''}</p></CardHeader>
      <CardContent>
        <form onSubmit={submit} className="space-y-4">
          <Select value={type} onValueChange={setType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{documentTypes.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
          <Input type="file" onChange={(event) => setFile(event.target.files?.[0] || null)} />
          {message && <p className="text-sm text-red-600">{message}</p>}
          <Button type="submit" className="w-full bg-[#E11B22] text-white"><FileUp className="h-4 w-4 mr-2"/>Upload document</Button>
        </form>
      </CardContent>
    </Card>
  </Page>;
}

function Page({ children }) {
  return <main className="min-h-screen bg-[#fafafa] flex items-center justify-center p-6"><div className="w-full max-w-md text-center">{children}</div></main>;
}
