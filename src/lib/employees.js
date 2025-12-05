import { getEmployees } from '@/lib/api';
import { useEffect, useState } from 'react';

// Plain helper to load employees (sales reps). Returns a normalized flat array.
export async function loadEmployees() {
  try {
    const list = await getEmployees();
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];
  }
}

// Optional React hook for convenience if needed by pages
export function useEmployees() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const list = await loadEmployees();
        if (!cancelled) setEmployees(list);
      } catch (e) {
        if (!cancelled) setError('Failed to load sales reps');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return { employees, loading, error };
}
