import { AdminSidebar } from "@/components/admin-sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row-reverse">
      
      <AdminSidebar />

      
      <main className="flex-1 lg:mr-64 min-h-screen w-full">
        
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card/80 backdrop-blur-sm px-4 lg:px-8 h-16">
          {/* Empty div or Mobile Menu Spacer: 
             The AdminSidebar component we built earlier has its 
             trigger at 'right-4', so this header will sit behind it 
             or you can move the trigger inside this div.
          */}
          <div className="lg:hidden w-10" /> 
          
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-sm text-muted-foreground">
              مدير النظام
            </span>
            
          </div>
        </header>

        {/* Content Area */}
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}