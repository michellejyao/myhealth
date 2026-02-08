

import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { BookPageLayout, BookSection } from '../components';
import { logService, type HealthLog } from '../../../services/logService';

interface MedicalLogsPageProps {
	userId?: string;
}

export function MedicalLogsPage({ userId: propUserId }: MedicalLogsPageProps) {
	const { user } = useAuth0();
	const userId = propUserId ?? user?.sub ?? '';
	const [logs, setLogs] = useState<HealthLog[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		if (!userId) {
			setLoading(false);
			return;
		}
		logService.fetchLogs(userId)
			.then(setLogs)
			.catch((err) => {
				setError(err.message || 'Failed to fetch logs.');
			})
			.finally(() => setLoading(false));
	}, [userId]);

	return (
		<BookPageLayout title="Medical Logs">
			<BookSection>
				{loading ? (
					<p className="text-sm text-black/70">Loading…</p>
				) : error ? (
					<div className="text-sm text-red-600">
						<strong>Error:</strong> {error}
					</div>
				) : logs.length === 0 ? (
					<p className="text-sm text-black/70">No logs yet. Log your health events to see them here.</p>
				) : (
					<ul className="space-y-2 max-h-[60vh] overflow-y-auto">
						{logs.map((log) => (
							<li key={log.id} className="border border-black/10 rounded p-3 bg-white/80">
								<div className="flex justify-between items-center">
									<span className="text-xs text-black/70">
										{log.date ? new Date(log.date).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—'}
									</span>
									{log.severity != null && (
										<span className="text-xs font-medium text-accent">Pain: {log.severity}/10</span>
									)}
								</div>
								<p className="font-medium text-black mt-1">{log.title}</p>
								{log.symptom_tags?.length > 0 && (
									<div className="flex flex-wrap gap-1 mt-1">
										{log.symptom_tags.slice(0, 5).map((t) => (
											<span key={t} className="text-xs bg-black/10 text-black/80 px-1.5 py-0.5 rounded">{t}</span>
										))}
									</div>
								)}
								{log.description && (
									<p className="text-sm text-black/70 mt-1 line-clamp-2">{log.description}</p>
								)}
							</li>
						))}
					</ul>
				)}
			</BookSection>
		</BookPageLayout>
	);
}
