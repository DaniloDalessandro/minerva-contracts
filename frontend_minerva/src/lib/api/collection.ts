import { apiClient } from './client';

export async function fetchCollection(url: string, params = new URLSearchParams()): Promise<any> {
  const requestedSize = Number(params.get('page_size') || 10);
  const query = new URLSearchParams(params);
  if (requestedSize > 100) query.set('page_size', '100');
  const read = async () => {
    const response = await apiClient(`${url}?${query}`);
    if (!response.ok) throw new Error(response.status === 429
      ? 'Muitas requisições. Aguarde um momento e tente novamente.'
      : `Não foi possível carregar os dados (${response.status}).`);
    return response.json();
  };
  const first = await read();
  if (requestedSize <= 100 || !Array.isArray(first.results)) return first;
  const results = [...first.results];
  let page = Number(query.get('page') || 1);
  while (results.length < first.count && first.results.length) {
    query.set('page', String(++page));
    const next = await read();
    if (!next.results?.length) break;
    results.push(...next.results);
  }
  return { ...first, results, next: null };
}

export async function fetchAllRecords(url: string): Promise<any[]> {
  const [base, search = ''] = url.split('?');
  const params = new URLSearchParams(search);
  params.set('page_size', '1000');
  const data = await fetchCollection(base, params);
  return data.results || data;
}
