import { CircleAlert ,X, Send, Bug, MessageCircle, AlertTriangle, Check } from "lucide-react";
import { useState, useEffect } from "react";
import emailjs from "@emailjs/browser";

function ReportForm({ isReportOpen, onUpdateReportState }) {
  const reportTypes = [
    {
      id: 'bug',
      name: 'Bug Report',
      icon: Bug,
      color: "text-red-500",
      styles: "bg-red-50 border-2 border-red-500"
    },
    {
      id: 'feature',
      name: 'Feature Report',
      icon: MessageCircle,
      color: "text-blue-500",
      styles: "bg-blue-50 border-2 border-blue-500"
    },
    {
      id: 'other',
      name: 'Other Report',
      icon: AlertTriangle,
      color: "text-yellow-500",
      styles: "bg-yellow-50 border-2 border-yellow-500"
    }
  ]
  //States
  const [formData, setFormData] = useState({
    reportType: 'bug',
    title: '',
    description: '',
    email: ''
  });
  const [validReport, setValidReport] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [progressState, setProgressState] = useState("");
  //Handlers
  const handleReportButtonClick = () => {
    setValidReport(false);
    onUpdateReportState(!isReportOpen);
  }
  const handleSendReport = async() => {
    if(!validReport)
      return;

    setIsLoading(true);
    setProgressState("in-progress")
    try {
      const ticketId = `#${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const adminTemplateParams = {
        title: formData.title,
        report_type: formData.reportType,
        description: formData.description,
        user_email: formData.email || "",
        timeStamp: new Date().toLocaleString(),
        url: window.location.href,
        user_agent: navigator.userAgent
      }

      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const reportTemplate = import.meta.env.VITE_EMAILJS_REPORT_TEMPLATE_ID;
      const confirmationTemplate = import.meta.env.VITE_EMAILJS_CONFIRMATION_TEMPLATE_ID;
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

      await emailjs.send(
          serviceId,
          reportTemplate,
          adminTemplateParams,
          publicKey
      );

      const userAckParams = {
        email: formData.email,
        title: formData.title,
        user_name: formData.email.split('@')[0],
        report_type: formData.reportType,
        ticket_id: ticketId,
        estimated_time: formData.reportType === "bug" ? "2-5 business days" : "1-2 weeks",
        time_stamp: Date.now().toLocaleString()
      }

      await emailjs.send(
          serviceId,
          confirmationTemplate,
          userAckParams,
          publicKey
      );
      // Reset form
      setFormData({
        reportType: 'bug',
        title: '',
        description: '',
        email: ''
      });
      setProgressState("completed")
      setTimeout(() => {
        setIsLoading(false);
        onUpdateReportState(false);
      }, 2000)
    } catch (e) {
      console.log("Error: ", e.message);
      setIsLoading(false);
    }
  };
  const handleCansel = () => {
    setValidReport(false);
    onUpdateReportState(!isReportOpen);
  }
  const handleInputChange = (field, value) => {
    setFormData(prevData => ({
      ...prevData,
      [field]: value
    }));
  }
  //Effects
  useEffect(() => {
    if(formData.title.trim() && formData.description.trim()) {
      setValidReport(true);
    } else {
      setValidReport(false);
    }
  }, [formData]);
  return(
      <div>
        <div
            className={`p-2 rounded-full cursor-pointer hover:bg-red-50 group`}
            title={`Report`}
            onClick={handleReportButtonClick}
        >
          <CircleAlert
              size={30}
              className={`group-hover:text-red-500 duration-300 ease-in-out`}
          />
        </div>
        {
            isReportOpen && (
                <div className={`modal-overlay`}>
                  { isLoading ? (
                      <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-lg">
                        {
                          progressState === "in-progress" ? (
                              <>
                                <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                                <p className="text-gray-700 font-medium">Sending your report...</p>
                              </>
                          ) : (
                              <>
                                  <Check size={50} className={`text-green-500`} />
                                  <p className="text-green-700 font-medium">Report send successfully</p>
                              </>
                          )
                        }
                      </div>
                  ) :(

                  <div
                      className={`fixed  right-1/2  translate-x-1/2 w-[30%] h-[95%]
                 flex flex-col px-5 gap-3
                 bg-white rounded-xl border border-gray-300`}
                  >
                    <div className={`flex h-[10%] items-center justify-between border-b border-gray-300`}>
                      <p className={`font-bold text-xl`}>Report an Issue</p>
                      <X
                          className={`cursor-pointer`}
                          onClick={handleCansel}
                      />
                    </div>
                    <div className={`flex-1 flex flex-col gap-4`}>
                      <div className={`flex flex-col gap-4`}>
                        <label>What type of issue is this?</label>
                        <div className={`flex flex-col gap-2 `}>
                          {
                            reportTypes.map(type => {
                              const IconComponent = type.icon;
                              return(
                                  <label
                                      key={type.id}
                                      className={`w-full h-14 flex items-center gap-4 px-3 rounded-md transition-all duration-100 ease-in-out
                                        ${formData.reportType === type.id ? type.styles : "border-2 border-gray-300"} `}
                                  >
                                    <input
                                        type="radio"
                                        name="type"
                                        value={type.id}
                                        checked={formData.reportType === type.id}
                                        onChange={(e) => handleInputChange( 'reportType', e.target.value)}
                                        className={`sr-only`}
                                    />
                                    <IconComponent
                                        className={`${type.color}`}
                                    />
                                    <span
                                        className={`font-medium text-gray-700 select-none`}
                                    >{type.name}</span>
                                  </label>
                              )
                            })
                          }
                        </div>
                      </div>
                      <div className={`flex flex-col gap-2`}>
                        <label htmlFor="briefSummary">Brief summary</label>
                        <input
                            type="text"
                            id={`briefSummary`}
                            placeholder={`What's the issue in few words?`}
                            className={`outline-none border border-gray-300 rounded-md h-15 px-3 `}
                            onChange={e => handleInputChange('title', e.target.value)}
                        />
                      </div>
                      <div className={`flex flex-col gap-2`}>
                        <label htmlFor="detailedDescription">Detailed description</label>
                        <textarea
                            name="detailedDescription"
                            id="detailedDescription"
                            rows="3"
                            placeholder={`Please describe the issue in detail. Include steps to reproduce if it's a bug.`}
                            className={`border border-gray-300 rounded-md outline-none resize-none p-3`}
                            onChange={e => handleInputChange('description', e.target.value)}
                        />
                      </div>
                      <div className={`flex flex-col gap-2`}>
                        <label htmlFor="email">Email(Optional)</label>
                        <input
                            type="email"
                            name="email"
                            id="email"
                            placeholder={`your@email.com (if you'd like a response)`}
                            className={`h-15 border border-gray-300 rounded-md  outline-none px-3`}
                            onChange={e => handleInputChange('email', e.target.value)}
                        />
                      </div>
                    </div>
                    <div className={`h-[10%] flex items-center justify-center gap-5`}>
                      <button
                          onClick={handleCansel}
                          className={`flex-1 h-12 bg-gray-300 rounded-md font-medium cursor-pointer hover:bg-gray-200`}>
                        Cansel
                      </button>
                      <button
                          onClick={handleSendReport}
                          className={`${validReport ? "bg-blue-600 hover:bg-blue-500 cursor-pointer" : "bg-gray-600 cursor-not-allowed"}
                        flex-1 h-12 flex items-center justify-center gap-2  text-white rounded-md font-medium 
                         `}>
                        <Send
                            size={20}
                        />
                        <span>Send Report</span>
                      </button>
                    </div>
                  </div>)}
                </div>
            )
        }
      </div>
  );
}
export default ReportForm;