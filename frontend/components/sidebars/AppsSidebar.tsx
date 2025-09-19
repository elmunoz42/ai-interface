import React, { useState } from 'react';
import { Box, Typography, Button, Modal, TextField, Chip, Alert } from '@mui/material';

const apps = [
	{
		name: 'Meeting Follow-up',
		description: 'Generate stakeholder follow-ups from meeting transcripts.',
		actionLabel: 'Open',
		key: 'meeting-followup',
	},
];

const AppsSidebar = () => {
	// Meeting Follow-up modal and logic
	const [meetingModalOpen, setMeetingModalOpen] = useState(false);
	const [presentersInput, setPresentersInput] = useState('');
	const [presenters, setPresenters] = useState<string[]>([]);
	const [meetingResults, setMeetingResults] = useState<{stakeholders: string[], followups: {name: string, email: string}[]} | null>(null);
	const [meetingUploadStatus, setMeetingUploadStatus] = useState<'idle' | 'uploading' | 'error'>('idle');
	const [meetingUploadMessage, setMeetingUploadMessage] = useState<string>('');
	const meetingModalStyle = {
		position: 'absolute' as const,
		top: '50%',
		left: '50%',
		transform: 'translate(-50%, -50%)',
		width: 700,
		bgcolor: 'background.paper',
		boxShadow: 24,
		p: 4,
		maxHeight: '90vh',
		overflowY: 'auto',
		borderRadius: 2,
	};

	 return (
		 <Box sx={{ width: '100%', maxWidth: '100%', pt: 2, pb: 2, pl: 2, pr: 2, backgroundColor: '#f8f9fa', display: 'flex', flexDirection: 'column', gap: 2, boxSizing: 'border-box' }}>
			 {apps.map((app, idx) => (
				 <Box key={app.key} sx={{ border: '1px solid #eee', borderRadius: 2, p: 2, bgcolor: '#fafafa', boxShadow: 1, width: '100%', boxSizing: 'border-box' }}>
					 <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>{app.name}</Typography>
					 <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{app.description}</Typography>
					 <Button variant="contained" size="small" onClick={() => setMeetingModalOpen(true)}>{app.actionLabel}</Button>
				 </Box>
			 ))}

			 {/* Meeting Follow-up Modal */}
			 <Modal open={meetingModalOpen} onClose={() => setMeetingModalOpen(false)}>
				 <Box sx={meetingModalStyle}>
					 <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
						 Meeting Follow-up Utility
					 </Typography>
					 <Box sx={{ mb: 3 }}>
						 <Typography variant="subtitle1" sx={{ mb: 1 }}>
							 Step 1: Enter full names of the presenter(s) (separate w/ commas)
						 </Typography>
						 <TextField
							 label="Presenters"
							 placeholder="e.g. Jane Doe, John Smith"
							 value={presentersInput}
							 onChange={e => setPresentersInput(e.target.value)}
							 fullWidth
							 sx={{ mb: 2 }}
						 />
						 <Typography variant="subtitle1" sx={{ mb: 1 }}>
							 Step 2: Upload the meeting chat txt file.
						 </Typography>
						 <Button
							 variant="contained"
							 component="label"
							 sx={{ minWidth: 180 }}
							 disabled={meetingUploadStatus === 'uploading'}
						 >
							 {meetingUploadStatus === 'uploading' ? 'Uploading...' : 'Upload TXT File'}
							 <input
								 type="file"
								 accept=".txt"
								 style={{ display: 'none' }}
								 disabled={meetingUploadStatus === 'uploading'}
								 onChange={async (e) => {
									 const file = e.target.files?.[0];
									 if (!file) return;
									 setMeetingUploadStatus('uploading');
									 setMeetingUploadMessage('Uploading and processing file...');
									 const formData = new FormData();
									 formData.append('file', file);
									 try {
										 const res = await fetch('http://localhost:8000/api/rag/meeting-followup/', {
											 method: 'POST',
											 body: formData,
										 });
										 if (!res.ok) {
											 setMeetingUploadStatus('error');
											 setMeetingUploadMessage('Upload failed: ' + (await res.text()));
										 } else {
											 const data = await res.json();
											 // Parse presenters from input
											 const enteredPresenters = presentersInput.split(',').map(s => s.trim()).filter(Boolean);
											 setPresenters(enteredPresenters);
											 // Filter out presenters from stakeholders and followups
											 const filteredStakeholders = data.stakeholders.filter((name: string) => !enteredPresenters.includes(name));
											 const filteredFollowups = data.followups.filter((f: {name: string}) => !enteredPresenters.includes(f.name));
											 setMeetingUploadStatus('idle');
											 setMeetingUploadMessage('Upload and processing complete!');
											 setMeetingResults({
												 stakeholders: filteredStakeholders,
												 followups: filteredFollowups
											 });
										 }
									 } catch (err) {
										 setMeetingUploadStatus('error');
										 setMeetingUploadMessage('Network error or server unavailable');
									 }
									 e.target.value = '';
								 }}
							 />
						 </Button>
						 {meetingUploadStatus === 'uploading' && (
							 <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
								 <span className="spinner" style={{ width: 24, height: 24, border: '3px solid #1976d2', borderTop: '3px solid #eee', borderRadius: '50%', display: 'inline-block', animation: 'spin 1s linear infinite' }} />
								 <Typography variant="body2">{meetingUploadMessage}</Typography>
								 <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
							 </Box>
						 )}
						 {meetingUploadStatus === 'error' && (
							 <Alert severity="error" sx={{ mt: 2 }}>{meetingUploadMessage}</Alert>
						 )}
						 {meetingUploadStatus === 'idle' && meetingUploadMessage && (
							 <Alert severity="success" sx={{ mt: 2 }}>{meetingUploadMessage}</Alert>
						 )}
						 {meetingResults && (
							 <Box sx={{ mt: 3 }}>
								 {presenters.length > 0 && (
									 <>
										 <Typography variant="subtitle1" sx={{ mb: 1 }}>Presenters:</Typography>
										 <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
											 {presenters.map((name, idx) => (
												 <Chip key={idx} label={name} color="secondary" sx={{ fontWeight: 500 }} />
											 ))}
										 </Box>
									 </>
								 )}
								 <Typography variant="subtitle1" sx={{ mb: 1 }}>Stakeholders:</Typography>
								 <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
									 {meetingResults.stakeholders.map((name, idx) => (
										 <Chip key={idx} label={name} color="primary" sx={{ fontWeight: 500 }} />
									 ))}
								 </Box>
								 <Typography variant="subtitle1" sx={{ mb: 1 }}>Follow-up Emails:</Typography>
								 <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
									 {meetingResults.followups.map((f, idx) => {
										 // Encode email body for mailto
										 const mailtoBody = encodeURIComponent(f.email);
										 const mailtoSubject = encodeURIComponent('Follow-Up on Innergy ERP Inquiry');
										 return (
											 <Box key={idx} sx={{ width: '45%', minWidth: 220, mb: 2 }}>
												 <a
													 href={`mailto:?subject=${mailtoSubject}&body=${mailtoBody}`}
													 target="_blank"
													 rel="noopener noreferrer"
													 style={{ textDecoration: 'none' }}
												 >
													 <Box sx={{ border: '1px solid #eee', borderRadius: 2, p: 2, bgcolor: '#fafafa', cursor: 'pointer', '&:hover': { boxShadow: 2, backgroundColor: '#f5f5f5' } }}>
														 <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>{f.name}</Typography>
														 <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{f.email}</Typography>
													 </Box>
												 </a>
											 </Box>
										 );
									 })}
								 </Box>
							 </Box>
						 )}
					 </Box>
					 <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
						 <Button onClick={() => setMeetingModalOpen(false)} variant="outlined">Close</Button>
					 </Box>
				 </Box>
			 </Modal>
		 </Box>
	 );
};

export default AppsSidebar;
