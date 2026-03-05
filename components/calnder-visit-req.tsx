
import { useState } from "react"
import { format, isBefore, startOfDay } from "date-fns"
import { ar } from "date-fns/locale"
import { Calendar as CalendarIcon } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "./ui/button"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"

export function CalendarVisitReq() {
    const [date, setDate] = useState<Date | undefined>(undefined)
    const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false)


    return (

        <div className="space-y-2">
            <Label>اختر التاريخ</Label>
            <Popover open={isDatePopoverOpen} onOpenChange={setIsDatePopoverOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground",
                        )}
                    >
                        <CalendarIcon className="ml-2 h-4 w-4" />
                        {date ? format(date, "PPP", { locale: ar }) : "اختر تاريخاً"}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"

                        selected={date}
                        onSelect={(newDate) => {
                            setDate(newDate)
                            setIsDatePopoverOpen(false)
                        }}
                        disabled={(date) => isBefore(startOfDay(date), startOfDay(new Date()))}
                        initialFocus
                        locale={ar}
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}