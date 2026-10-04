import ClientPage from './client-page';

export default async function CustomerPage({ params }: { params: Promise<{ customerId: string }> }) {
  const { customerId } = await params;
  let conversations = [];
  try {
    const res = await fetch(`http://localhost:5000/customers/${customerId}/conversations`, { cache: 'no-store' });
    if (res.ok) {
      conversations = await res.json();
    }
  } catch (e) {
    console.error("Failed to fetch conversations", e);
  }

  return <ClientPage customerId={customerId} initialConversations={conversations} />;
}
