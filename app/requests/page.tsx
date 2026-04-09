import Link from 'next/link';
import { FileText, ClipboardCheck, ShieldCheck } from 'lucide-react';
import { PageHeader } from "@/components/page-header"
import { Footer } from "@/components/footer"

const RequestSelectionPage = () => {
    const requestTypes = [
        {
            title: "طلبات التفرغ",
            description: "إصدار طلبات التفرغ الرسمية للفرسان والحكام والمدربين للمشاركة في البطولات.",
            cta: "طلب تفرغ",
            href: "/leave-request",
            icon: <FileText className="w-8 h-8 text-emerald-600" />,
            bgColor: "bg-emerald-50",
        },
        {
            title: "طلب مشهد",
            description: "رفع وتقديم طلبات مشاهد الحضور والإنجازات الخاصة بالفرسان.",
            cta: " طلب مشهد",
            href: "/request-cert",
            icon: <ClipboardCheck className="w-8 h-8 text-blue-600" />,
            bgColor: "bg-blue-50",
        },
        {
            title: "خطابات عدم ممانعة",
            description: "استخراج خطابات عدم ممانعة رسمية ومعتمدة للجهات المعنية.",
            cta: "طلب خطاب عدم ممانعة",
            href: "/request-no-obj",
            icon: <ShieldCheck className="w-8 h-8 text-purple-600" />,
            bgColor: "bg-purple-50",
        },
    ];

    return (
        <div>
            <PageHeader
            title=""
            description=''
                
              />
            <div className="min-h-screen bg-gray-50 py-16 px-4" dir="rtl">

                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h1 className="text-4xl font-black text-gray-900 mb-4"> الطلبات</h1>
                        <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                            اختر نوع الطلب الذي ترغب في إصداره.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {requestTypes.map((item, index) => (
                            <div
                                key={index}
                                className="group bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 flex flex-col items-center text-center"
                            >
                                <div className={`${item.bgColor} p-4 rounded-2xl mb-6 group-hover:scale-110 transition-transform duration-300`}>
                                    {item.icon}
                                </div>

                                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                                    {item.title}
                                </h3>

                                <p className="text-gray-500 mb-8 leading-relaxed min-h-[60px]">
                                    {item.description}
                                </p>

                                <Link
                                    href={item.href}
                                    className="mt-auto w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-gray-900 hover:bg-gray-800 transition-colors duration-200"
                                >
                                    {item.cta}
                                </Link>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <Footer />
        </div>
    );
};

export default RequestSelectionPage;