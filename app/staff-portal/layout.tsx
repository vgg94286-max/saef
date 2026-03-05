
export default function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      
      
        <div className="p-8">{children}</div>
      
    </div>
  );
}
