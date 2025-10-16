import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle2, Loader2, Calendar } from "lucide-react";
import logo from "@/assets/logo.png";
import { addMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useLoanApplication } from "@/contexts/LoanApplicationContext";
import { toast } from "sonner";

const Approval = () => {
  const navigate = useNavigate();
  const { applicationId, applicationData, updateApplication, loading: contextLoading, setApplicationId } = useLoanApplication();
  
  const [analysisLoading, setAnalysisLoading] = useState(true);
  const [showApproval, setShowApproval] = useState(false);
  const [approvedAmount, setApprovedAmount] = useState(0);
  const [installments, setInstallments] = useState<number[]>([]);
  const [selectedInstallments, setSelectedInstallments] = useState<number | null>(null);
  const [showInstallmentDetails, setShowInstallmentDetails] = useState(false);

  useEffect(() => {
    if (!applicationId) {
      toast.error("Nenhuma simulação encontrada. Por favor, comece novamente.");
      navigate("/simular");
      return;
    }

    if (!applicationData) return; // Wait for data to be fetched

    const requestedAmount = applicationData.requested_amount || 0;
    
    const timer = setTimeout(() => {
      setAnalysisLoading(false);
      
      const approved = requestedAmount > 100 ? requestedAmount - 100 : requestedAmount;
      setApprovedAmount(approved);
      
      const totalWithInterest = approved * 1.30;
      const installmentOptions = [3, 6, 9, 12].map(months => 
        Math.floor(totalWithInterest / months)
      );
      setInstallments(installmentOptions);
      
      setShowApproval(true);
    }, 15000);

    return () => clearTimeout(timer);
  }, [applicationId, applicationData, navigate]);

  const handleApprovalClick = async () => {
    if (!selectedInstallments) {
      toast.error("Por favor, selecione o número de parcelas.");
      return;
    }
    
    const updateData = {
      approved_amount: approvedAmount,
      installments_option: selectedInstallments,
      monthly_payment: installments[{3: 0, 6: 1, 9: 2, 12: 3}[selectedInstallments] || 0],
      status: 'approved'
    };

    await updateApplication(updateData);
    
    if (!contextLoading) {
      toast.success("Condições aceitas! Agora, vamos aos documentos.");
      navigate("/documentos");
    }
  };

  const calculateInstallmentDates = () => {
    if (!selectedInstallments) return [];
    
    const dates = [];
    const startDate = new Date();
    
    for (let i = 1; i <= selectedInstallments; i++) {
      const paymentDate = addMonths(startDate, i);
      dates.push({
        number: i,
        date: format(paymentDate, "dd/MM/yyyy", { locale: ptBR }),
        amount: installments[{3: 0, 6: 1, 9: 2, 12: 3}[selectedInstallments] || 0]
      });
    }
    
    return dates;
  };

  if (analysisLoading || (applicationId && !applicationData)) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center">
        <header className="border-b border-border bg-card fixed top-0 w-full z-10">
          <div className="container mx-auto px-4 py-4 flex items-center justify-center">
            <img src={logo} alt="PixUp Empréstimos" className="h-12" />
          </div>
        </header>
        
        <div className="text-center space-y-6 animate-fade-in px-4">
          <Loader2 className="h-16 w-16 text-primary animate-spin mx-auto" />
          <div className="space-y-2">
            <h2 className="text-3xl font-bold">Analisando seu pedido...</h2>
            <p className="text-muted-foreground text-lg">
              Aguarde enquanto verificamos suas informações, {applicationData?.name?.split(' ')[0]}
            </p>
          </div>
          <div className="max-w-md mx-auto space-y-2 text-sm text-muted-foreground">
            <p className="flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Verificando dados pessoais
            </p>
            <p className="flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Analisando score de crédito
            </p>
            <p className="flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Calculando melhores condições
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-center">
          <img src={logo} alt="PixUp Empréstimos" className="h-12" />
        </div>
      </header>

      <Dialog open={showApproval} onOpenChange={(isOpen) => {
        if (!isOpen) {
          setApplicationId(null);
          navigate('/simular');
        }
      }}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl">
              Parabéns, {applicationData?.name?.split(' ')[0]}! Seu empréstimo foi aprovado!
            </DialogTitle>
            <DialogDescription className="text-center text-base">
              Conseguimos aprovar um valor especial para você
            </DialogDescription>
          </DialogHeader>
          
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 dark:from-primary/10 dark:to-primary/5 dark:border-primary/20">
            <CardContent className="pt-6 text-center space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Valor aprovado</p>
                <p className="text-4xl font-bold text-primary">
                  R$ {approvedAmount.toLocaleString("pt-BR")}
                </p>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-semibold">Escolha o número de parcelas: *</p>
                <div className="grid grid-cols-2 gap-2">
                  {[3, 6, 9, 12].map((months, idx) => (
                    <button
                      key={months}
                      type="button"
                      disabled={contextLoading}
                      onClick={() => {
                        setSelectedInstallments(months);
                        setShowInstallmentDetails(true);
                      }}
                      className={`bg-background rounded-lg p-3 border-2 transition-all hover:border-primary/50 ${
                        selectedInstallments === months 
                          ? "border-primary bg-primary/5 dark:bg-primary/10" 
                          : "border-border"
                      }`}
                    >
                      <p className="text-xs text-muted-foreground">{months}x de</p>
                      <p className="font-bold text-sm text-primary">
                        R$ {installments[idx]?.toLocaleString("pt-BR")}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              {showInstallmentDetails && selectedInstallments && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2 justify-center mb-3">
                    <Calendar className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold">Datas das Parcelas:</p>
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {calculateInstallmentDates().map((installment) => (
                      <div key={installment.number} className="flex justify-between items-center bg-background/50 rounded-lg px-3 py-2 text-sm">
                        <span className="font-medium">Parcela {installment.number}</span>
                        <span className="text-muted-foreground">{installment.date}</span>
                        <span className="font-bold text-primary">
                          R$ {installment.amount.toLocaleString("pt-BR")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Button
            onClick={handleApprovalClick}
            disabled={!selectedInstallments || contextLoading}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg py-6 disabled:opacity-50"
          >
            {contextLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            {contextLoading 
              ? "Atualizando..."
              : selectedInstallments 
                ? `Continuar com ${selectedInstallments}x de R$ ${installments[{3: 0, 6: 1, 9: 2, 12: 3}[selectedInstallments] || 0]?.toLocaleString("pt-BR")}`
                : "Selecione o número de parcelas"
            }
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Approval;
