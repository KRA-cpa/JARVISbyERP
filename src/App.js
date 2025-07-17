import React from 'react';
import { initializeApp } from 'firebase/app';
import { getAnalytics } from "firebase/analytics";
import { 
    getAuth, 
    signInAnonymously, 
    onAuthStateChanged 
} from 'firebase/auth';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    doc, 
    onSnapshot,
    updateDoc,
    deleteDoc
} from 'firebase/firestore';
import { 
    Container, 
    Grid, 
    Card, 
    CardContent, 
    Typography, 
    TextField, 
    Button, 
    Select, 
    MenuItem, 
    FormControl, 
    InputLabel, 
    Box, 
    Modal, 
    Chip,
    CircularProgress,
    IconButton,
    ThemeProvider,
    createTheme,
    CssBaseline,
    Stack
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

// --- MUI Theme ---
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});


const modalStyle = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: '90%',
  maxWidth: 600,
  bgcolor: 'background.paper',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  maxHeight: '90vh',
  overflowY: 'auto',
  borderRadius: 2
};


// --- Helper Functions ---
const createOrUpdateArtifacts = (issueData, isUpdate = false) => {
  console.log(`Calling endpoint to ${isUpdate ? 'update' : 'create'} artifacts for issue:`, issueData.id);

  const appsScriptUrl = 'https://script.google.com/macros/s/AKfycbyijvvWV_AaHhxfrrlpIoZjpDkwxB2TqEix2MTrk8q8znrOPTCNhQjXESOD_LpaQT2y/exec'; 

  // Correctly check if the URL is a placeholder before fetching
  if (appsScriptUrl && !appsScriptUrl.includes('YOUR_WEB_APP_URL_HERE')) {
      fetch(appsScriptUrl, {
        method: 'POST',
        mode: 'no-cors', 
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: JSON.stringify(issueData),
      })
      .then(res => console.log("Request sent to Apps Script."))
      .catch(err => console.error("Error sending to Apps Script:", err));
  } else {
      console.warn("appsScriptUrl is not set. Skipping artifact creation.");
  }

  // Local simulation for XML can still be useful for debugging
  const generateXml = (data) => {
    let tagsXml = data.tags ? data.tags.map(tag => `<tag>${tag}</tag>`).join('') : '';
    return `<?xml version="1.0" encoding="UTF-8"?>
<issue>
  <id>${data.id}</id>
  <title>${data.title}</title>
  <system>${data.system}</system>
  <description>${data.description}</description>
  <solution>${data.solution}</solution>
  <issueType>${data.issueType}</issueType>
  <tags>${tagsXml}</tags>
  <isOutdated>${data.isOutdated}</isOutdated>
  <linkedIssue>${data.linkedIssue || ''}</linkedIssue>
</issue>`;
  };
  const xmlContent = generateXml(issueData);
  console.log("Simulating XML file creation/update with content:", xmlContent);
};


// --- Main App Component ---
export default function App() {
    const [issues, setIssues] = React.useState([]);
    const [filteredIssues, setFilteredIssues] = React.useState([]);
    const [selectedIssue, setSelectedIssue] = React.useState(null);
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [newTag, setNewTag] = React.useState('');
    const [searchTerm, setSearchTerm] = React.useState('');
    const [loading, setLoading] = React.useState(true);
    const [view, setView] = React.useState('issues'); // 'issues' or 'systems'
    const [systems, setSystems] = React.useState([]);
    const [newSystem, setNewSystem] = React.useState('');
    const [dbStatus, setDbStatus] = React.useState('connecting');

    // --- Firebase State ---
    const [db, setDb] = React.useState(null);
    const [userId, setUserId] = React.useState(null);

    // --- Form State ---
    const [title, setTitle] = React.useState('');
    const [system, setSystem] = React.useState('');
    const [description, setDescription] = React.useState('');
    const [solution, setSolution] = React.useState('');
    const [issueType, setIssueType] = React.useState('one-time');
    const [tags, setTags] = React.useState('');
    const [linkedIssue, setLinkedIssue] = React.useState('');

    // --- Firebase Initialization ---
    React.useEffect(() => {
        const firebaseConfig = {
            apiKey: "AIzaSyDXYPPI-FifYgN39SP7yt96BMT5co0mYlw",
            authDomain: "jarvisbyerp.firebaseapp.com",
            projectId: "jarvisbyerp",
            storageBucket: "jarvisbyerp.appspot.com",
            messagingSenderId: "3188796143",
            appId: "1:3188796143:web:850ba08114a59b6158c91a",
            measurementId: "G-523E3W5ZMN"
        };

        if (firebaseConfig && firebaseConfig.apiKey) {
            try {
                    const app = initializeApp(firebaseConfig);
                    const analytics = getAnalytics(app); // <-- ADD THIS LINE BACK
                    const firestore = getFirestore(app);
                const authInstance = getAuth(app);
                setDb(firestore);

                onAuthStateChanged(authInstance, (user) => {
                    if (user) {
                        setUserId(user.uid);
                        setDbStatus('connected');
                    } else {
                        signInAnonymously(authInstance).catch((error) => {
                            console.error("Anonymous sign-in failed:", error);
                            setDbStatus('disconnected');
                            setLoading(false); // <-- ADD THIS LINE
                       });
                    }
                });
            } catch(e) {
                console.error("Firebase initialization failed:", e);
                setDbStatus('disconnected');
            }
        } else {
            console.warn("Firebase config not found. Running in offline mode.");
            setDbStatus('disconnected');
            setLoading(false);
        }
    }, []);

    // --- Firestore Data Fetching ---
    React.useEffect(() => {
        if (!db || !userId) return;
        
        // eslint-disable-next-line no-undef
        const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
        
        // Fetch Systems
        const systemsCollection = collection(db, `artifacts/${appId}/public/data/systems`);
        const systemsUnsubscribe = onSnapshot(systemsCollection, (snapshot) => {
            const systemsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setSystems(systemsData);
            if(systemsData.length > 0 && !system){
                setSystem(systemsData[0].name);
            }
        }, (error) => {
            console.error("Error fetching systems:", error);
        });

        // Fetch Issues
        setLoading(true);
        const issuesCollection = collection(db, `artifacts/${appId}/users/${userId}/issues`);
        const issuesUnsubscribe = onSnapshot(issuesCollection, (snapshot) => {
            const issuesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setIssues(issuesData);
            setFilteredIssues(issuesData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching issues: ", error);
            setLoading(false);
        });

        return () => {
            systemsUnsubscribe();
            issuesUnsubscribe();
        };
        
    }, [db, userId]);
    
    // --- Search and Filter ---
    React.useEffect(() => {
        const lowercasedTerm = searchTerm.toLowerCase();
        const filtered = issues.filter(issue => 
            issue.title.toLowerCase().includes(lowercasedTerm) ||
            issue.description.toLowerCase().includes(lowercasedTerm) ||
            (issue.tags && issue.tags.some(tag => tag.toLowerCase().includes(lowercasedTerm)))
        );
        setFilteredIssues(filtered);
    }, [searchTerm, issues]);

    // --- Event Handlers ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title || !description || !system || !db) return;

        const newIssueData = {
            title, system, description, solution, issueType,
            tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
            linkedIssue, createdAt: new Date(), status: 'open', isOutdated: false,
        };

        try {
            // eslint-disable-next-line no-undef
            const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
            const docRef = await addDoc(collection(db, `artifacts/${appId}/users/${userId}/issues`), newIssueData);
            createOrUpdateArtifacts({ id: docRef.id, ...newIssueData });
            // Reset form
            setTitle(''); setSystem(systems[0]?.name || ''); setDescription('');
            setSolution(''); setIssueType('one-time'); setTags(''); setLinkedIssue('');
        } catch (error) {
            console.error("Error adding document: ", error);
        }
    };
    
    const handleAddTag = async () => {
        if (selectedIssue && newTag && db) {
            const updatedTags = [...(selectedIssue.tags || []), newTag];
            // eslint-disable-next-line no-undef
            const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
            const issueRef = doc(db, `artifacts/${appId}/users/${userId}/issues`, selectedIssue.id);
            await updateDoc(issueRef, { tags: updatedTags });
            const updatedIssue = { ...selectedIssue, tags: updatedTags };
            setSelectedIssue(updatedIssue);
            createOrUpdateArtifacts(updatedIssue, true);
            setNewTag('');
        }
    };

    const handleDeleteTag = async (tagToDelete) => {
        if (selectedIssue && db) {
            const updatedTags = selectedIssue.tags.filter(tag => tag !== tagToDelete);
            // eslint-disable-next-line no-undef
            const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
            const issueRef = doc(db, `artifacts/${appId}/users/${userId}/issues`, selectedIssue.id);
            await updateDoc(issueRef, { tags: updatedTags });
            const updatedIssue = { ...selectedIssue, tags: updatedTags };
            setSelectedIssue(updatedIssue);
            createOrUpdateArtifacts(updatedIssue, true);
        }
    };

    const toggleOutdated = async (issue) => {
         if (db) {
            const isNowOutdated = !issue.isOutdated;
            // eslint-disable-next-line no-undef
            const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
            const issueRef = doc(db, `artifacts/${appId}/users/${userId}/issues`, issue.id);
            await updateDoc(issueRef, { isOutdated: isNowOutdated });
            const updatedIssue = { ...issue, isOutdated: isNowOutdated };
            createOrUpdateArtifacts(updatedIssue, true);
            if (isModalOpen && selectedIssue.id === issue.id) {
                setSelectedIssue(updatedIssue);
            }
        }
    };

    const handleAddSystem = async () => {
        if (!newSystem.trim() || !db) return;
        try {
            // eslint-disable-next-line no-undef
            const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
            await addDoc(collection(db, `artifacts/${appId}/public/data/systems`), { name: newSystem.trim() });
            setNewSystem('');
        } catch (error) {
            console.error("Error adding new system:", error);
        }
    };

    const handleDeleteSystem = async (systemId) => {
        if(db) {
            try {
                // eslint-disable-next-line no-undef
                const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
                await deleteDoc(doc(db, `artifacts/${appId}/public/data/systems`, systemId));
            } catch (error) {
                console.error("Error deleting system:", error);
            }
        }
    }

    const renderIssuePage = () => (
        <Grid container spacing={4} direction="column">
            {/* New Issue Form */}
            <Grid item xs={12}>
                <Card variant="outlined">
                    <CardContent>
                        <Typography variant="h5" component="h2" gutterBottom>
                            Log a New Issue
                        </Typography>
                        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <TextField label="Issue Title" variant="outlined" fullWidth value={title} onChange={e => setTitle(e.target.value)} required />
                            <FormControl fullWidth>
                                <InputLabel>System/Feature</InputLabel>
                                <Select value={system} label="System/Feature" onChange={e => setSystem(e.target.value)} required>
                                    {systems.map(sys => <MenuItem key={sys.id} value={sys.name}>{sys.name}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <TextField label="Description" variant="outlined" multiline rows={4} fullWidth value={description} onChange={e => setDescription(e.target.value)} required />
                            <TextField label="Solution" variant="outlined" multiline rows={4} fullWidth value={solution} onChange={e => setSolution(e.target.value)} />
                            <FormControl fullWidth>
                                <InputLabel>Issue Type</InputLabel>
                                <Select value={issueType} label="Issue Type" onChange={e => setIssueType(e.target.value)}>
                                    <MenuItem value="one-time">One-Time Issue</MenuItem>
                                    <MenuItem value="recurring">Recurring Issue</MenuItem>
                                </Select>
                            </FormControl>
                            <TextField label="Tags (comma-separated)" variant="outlined" fullWidth value={tags} onChange={e => setTags(e.target.value)} />
                            <FormControl fullWidth>
                                <InputLabel>Link to Issue</InputLabel>
                                <Select value={linkedIssue} label="Link to Issue" onChange={e => setLinkedIssue(e.target.value)}>
                                    <MenuItem value=""><em>None</em></MenuItem>
                                    {issues.map(issue => <MenuItem key={issue.id} value={issue.id}>{`${issue.id.substring(0,5)}... - ${issue.title}`}</MenuItem>)}
                                </Select>
                            </FormControl>
                            <Button type="submit" variant="contained" size="large" fullWidth disabled={dbStatus !== 'connected'}>Log Issue</Button>
                        </Box>
                    </CardContent>
                </Card>
            </Grid>

            {/* Issue List */}
            <Grid item xs={12}>
                 <Card variant="outlined">
                    <CardContent>
                        <Typography variant="h5" component="h2" gutterBottom>
                            Logged Issues
                        </Typography>
                        <TextField label="Search by Title, Description, or Tag" variant="outlined" fullWidth value={searchTerm} onChange={e => setSearchTerm(e.target.value)} sx={{ mb: 2 }} />
                         <Box sx={{ maxHeight: '70vh', overflowY: 'auto', p: 0.5 }}>
                            {loading ? <Box sx={{display: 'flex', justifyContent: 'center', p: 4}}><CircularProgress /></Box> : (
                                filteredIssues.length > 0 ? filteredIssues.map(issue => (
                                    <Card key={issue.id} variant="outlined" sx={{ mb: 2, bgcolor: issue.isOutdated ? '#fffbe6' : '#f9f9f9' }}>
                                        <CardContent>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <Box>
                                                    <Typography variant="h6">{issue.title}</Typography>
                                                    <Typography variant="caption" color="text.secondary">ID: {issue.id}</Typography>
                                                </Box>
                                                <Box sx={{display: 'flex', gap: 1}}>
                                                    <Chip label={issue.issueType} color={issue.issueType === 'recurring' ? 'error' : 'success'} size="small" />
                                                    {issue.isOutdated && <Chip label="Outdated" color="warning" size="small" />}
                                                </Box>
                                            </Box>
                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }} noWrap>{issue.description}</Typography>
                                            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                                    {issue.tags && issue.tags.map((tag, index) => <Chip key={index} label={tag} size="small" />)}
                                                </Box>
                                                <Button size="small" onClick={() => { setSelectedIssue(issue); setIsModalOpen(true); }}>View Details</Button>
                                            </Box>
                                        </CardContent>
                                    </Card>
                                )) : <Typography align="center" color="text.secondary" sx={{py: 4}}>No issues found.</Typography>
                            )}
                        </Box>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    );

    const renderSystemsPage = () => (
        <Card variant="outlined">
            <CardContent>
                <Typography variant="h5" component="h2" gutterBottom>
                    Manage Systems/Features
                </Typography>
                <Box sx={{ mt: 2 }}>
                    {systems.map(s => (
                        <Box key={s.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1, borderBottom: 1, borderColor: 'divider' }}>
                           <Typography>{s.name}</Typography>
                           <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteSystem(s.id)} disabled={dbStatus !== 'connected'}>
                               <DeleteIcon />
                           </IconButton>
                        </Box>
                    ))}
                </Box>
                 <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                    <TextField 
                        label="New System Name" 
                        variant="outlined" 
                        fullWidth 
                        value={newSystem} 
                        onChange={e => setNewSystem(e.target.value)} 
                        required 
                    />
                    <Button 
                        variant="contained" 
                        onClick={handleAddSystem}
                        disabled={dbStatus !== 'connected' || !newSystem.trim()}
                    >
                        Add
                    </Button>
                </Box>
            </CardContent>
        </Card>
    );


    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <Container maxWidth="md" sx={{ py: 4 }}>
                <header>
                    <Stack direction="row" spacing={2} justifyContent="center" alignItems="center" mb={1}>
                        <Typography variant="h3" component="h1" align="center">
                            Issue Log System
                        </Typography>
                        <Chip 
                            label={`DB: ${dbStatus}`} 
                            color={dbStatus === 'connected' ? 'success' : (dbStatus === 'connecting' ? 'warning' : 'error')}
                            size="small"
                        />
                    </Stack>
                    <Typography variant="subtitle1" align="center" color="text.secondary" paragraph>
                        Track and manage application issues efficiently.
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 4}}>
                        <Button variant={view === 'issues' ? 'contained' : 'outlined'} onClick={() => setView('issues')}>Issue Log</Button>
                        <Button variant={view === 'systems' ? 'contained' : 'outlined'} onClick={() => setView('systems')}>Manage Systems</Button>
                    </Box>
                </header>

                {view === 'issues' ? renderIssuePage() : renderSystemsPage()}
                
                <Modal open={isModalOpen} onClose={() => setIsModalOpen(false)}>
                    <Box sx={modalStyle}>
                        {selectedIssue && (
                            <>
                                <Typography variant="h5" component="h2" gutterBottom>{selectedIssue.title}</Typography>
                                <Typography sx={{ mt: 2 }}><strong>System/Feature:</strong> {selectedIssue.system}</Typography>
                                <Typography sx={{ mt: 2 }}><strong>Description:</strong> {selectedIssue.description}</Typography>
                                <Typography sx={{ mt: 2 }}><strong>Solution:</strong> {selectedIssue.solution || 'Not provided'}</Typography>
                                <Typography sx={{ mt: 2 }}><strong>Type:</strong> {selectedIssue.issueType}</Typography>
                                {selectedIssue.linkedIssue && <Typography sx={{ mt: 2 }}><strong>Linked Issue:</strong> {selectedIssue.linkedIssue}</Typography>}
                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2 }}>
                                    <strong>Tags:</strong> 
                                    {selectedIssue.tags && selectedIssue.tags.map((tag, index) => <Chip key={index} label={tag} onDelete={() => handleDeleteTag(tag)}/>)}
                                </Box>
                                <Box sx={{ display: 'flex', gap: 2, mt: 3, borderTop: 1, borderColor: 'divider', pt: 2 }}>
                                    <TextField label="New Tag" size="small" value={newTag} onChange={(e) => setNewTag(e.target.value)} />
                                    <Button variant="contained" onClick={handleAddTag} disabled={dbStatus !== 'connected'}>Add Tag</Button>
                                </Box>
                                <Box sx={{ mt: 3, borderTop: 1, borderColor: 'divider', pt: 2 }}>
                                    <Button variant="contained" color={selectedIssue.isOutdated ? 'success' : 'warning'} onClick={() => toggleOutdated(selectedIssue)} disabled={dbStatus !== 'connected'}>
                                        {selectedIssue.isOutdated ? 'Mark as Not Outdated' : 'Mark as Outdated'}
                                    </Button>
                                </Box>
                            </>
                        )}
                    </Box>
                </Modal>
            </Container>
        </ThemeProvider>
    );
}
