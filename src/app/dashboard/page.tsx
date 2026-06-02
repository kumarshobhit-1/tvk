// Simplified maintenance page for Dashboard

export default function DashboardPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-3xl mx-auto text-center border rounded-lg p-8 bg-white shadow-sm">
        <h1 className="text-2xl font-bold mb-4">Dashboard Under Maintenance</h1>
        <p className="mb-6 text-gray-700">
          Our team is currently performing maintenance on the Dashboard page. Everything else on the site is working normally.
        </p>
        <p className="mb-6 text-gray-700">
          You can still browse the Home and Exams pages and attempt exams as usual.
        </p>

        <div className="flex justify-center gap-4">
          <a href="/" className="px-4 py-2 bg-blue-600 text-white rounded-md shadow">Home</a>
          <a href="/exam" className="px-4 py-2 bg-green-600 text-white rounded-md shadow">Exams</a>
        </div>

        <p className="text-sm text-gray-500 mt-6">We apologize for the inconvenience — our team is working to restore the Dashboard as soon as possible...</p>
        <p className="text-sm text-gray-500 mt-6">Thank You for your Patience..</p>
      </div>
    </div>
  );
}