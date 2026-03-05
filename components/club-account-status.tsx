
export default function AccountStatusBadge({ status }: { status: string }) {
    if (status === "مفعل")
        return (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                {status}
            </span>
        );

    if (status === "قيد المراجعة")
        return (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                {status}
            </span>
        );

    if (status === "معطل")
        return (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                {status}
            </span>
        );

    return <span className="text-xs text-muted-foreground">{status}</span>;
}