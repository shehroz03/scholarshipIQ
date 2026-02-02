import { api } from "../api";
import { toast } from "sonner";

export const downloadResume = async (setLoading: (loading: boolean) => void) => {
    try {
        setLoading(true);

        // 1. Get the blob from API
        const blob = await api.resume.download();

        // 2. Create a link and trigger download
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;

        // Set filename
        link.setAttribute("download", "My_ScholarIQ_Resume.pdf");

        document.body.appendChild(link);
        link.click();

        // Cleanup
        if (link.parentNode) {
            link.parentNode.removeChild(link);
        }
        window.URL.revokeObjectURL(url);

        toast.success("Resume Downloaded Successfully! 📄✅");

    } catch (error) {
        console.error("Download failed", error);
        toast.error("Could not generate resume. Please complete your profile first.");
    } finally {
        setLoading(false);
    }
};
