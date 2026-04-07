// app/(protected)/agencydashboard/page.tsx
import { currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Building2,
  Briefcase,
  FileText,
  IndianRupee,
  LayoutDashboard,
  Users,
  GanttChartSquare,
  ScrollText,
  Landmark,
  FileCheck,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

async function AgencyDashboardContent() {
  const user = await currentUser();

  if (!user || user.role !== "agency" || !user.agencyDetailsId) {
    redirect("/auth/login");
  }

  const agency = await db.agencyDetails.findUnique({
    where: { id: user.agencyDetailsId },
    include: {
      users: {
        select: {
          id: true,
          name: true,
          email: true,
          mobileNumber: true,
          role: true,
          userStatus: true,
        },
      },
      Bidagency: {
        include: {
          WorksDetail: {
            include: {
              paymentDetails: {
                include: {
                  securityDeposit: true,
                  lessIncomeTax: true,
                  lessLabourWelfareCess: true,
                  lessTdsCgst: true,
                  lessTdsSgst: true,
                },
              },
              AOCDetails: true,
              ApprovedActionPlanDetails: true,
              workEstimateItems: true,
              workMeasurementBooks: true,
              workBillAbstracts: {
                include: {
                  deductions: true,
                },
              },
            },
          },
          workorderdetails: {
            include: {
              awardofcontractdetails: true,
            },
          },
          technicalEvelution: {
            include: {
              credencial: true,
              validityofdocument: true,
            },
          },
          earnestMoneyRegister: true,
        },
      },
      Bid: {
        include: {
          quotation: true,
        },
      },
      Order: {
        include: {
          items: true,
          timeline: true,
          documents: true,
        },
      },
    },
  });

  if (!agency) {
    return <div className="p-6">Agency details not found.</div>;
  }

  const bidAgencies = agency.Bidagency;
  const works = bidAgencies.flatMap((ba) => (ba.WorksDetail ? [ba.WorksDetail] : []));
  const aocs = bidAgencies.flatMap((ba) =>
    ba.workorderdetails.map((wod) => wod.awardofcontractdetails)
  );
  const payments = works.flatMap((w) => w.paymentDetails);
  const earnestMoneyRecords = bidAgencies.flatMap((ba) => ba.earnestMoneyRegister);
  // ✅ Type predicate to filter out null/undefined
  const technicalEvals = bidAgencies
    .map((ba) => ba.technicalEvelution)
    .filter((te): te is NonNullable<typeof te> => te != null);
  const bids = agency.Bid;
  const orders = agency.Order;
  const users = agency.users;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Agency Dashboard</h1>
        </div>
        <Badge variant="outline" className="text-sm">
          {agency.agencyType} • {agency.name}
        </Badge>
      </div>

      {/* Agency Profile Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" /> Agency Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Name</p>
            <p className="font-medium">{agency.name}</p>
          </div>
          {agency.proprietorName && (
            <div>
              <p className="text-muted-foreground">Proprietor</p>
              <p className="font-medium">{agency.proprietorName}</p>
            </div>
          )}
          <div>
            <p className="text-muted-foreground">Mobile</p>
            <p className="font-medium">{agency.mobileNumber || "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Email</p>
            <p className="font-medium">{agency.email || "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">PAN</p>
            <p className="font-medium">{agency.pan || "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">GST</p>
            <p className="font-medium">{agency.gst || "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">TIN</p>
            <p className="font-medium">{agency.tin || "—"}</p>
          </div>
          <div className="col-span-2">
            <p className="text-muted-foreground">Contact Details</p>
            <p className="font-medium">{agency.contactDetails || "—"}</p>
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Works
            </CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{works.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              AOCs Issued
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{aocs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Orders
            </CardTitle>
            <GanttChartSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Bids Submitted
            </CardTitle>
            <ScrollText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bids.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Payments
            </CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{payments.reduce((acc, p) => acc + p.netAmt, 0).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabbed Detailed Sections */}
      <Tabs defaultValue="works" className="space-y-4">
        <TabsList>
          <TabsTrigger value="works">Works</TabsTrigger>
          <TabsTrigger value="aocs">AOC</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="bids">Bids</TabsTrigger>
          <TabsTrigger value="earnest">Earnest Money</TabsTrigger>
          <TabsTrigger value="tech">Tech Evaluations</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        {/* Works Tab */}
        <TabsContent value="works">
          <Card>
            <CardHeader>
              <CardTitle>Work Details</CardTitle>
              <CardDescription>
                All works associated with your agency.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Activity Code</TableHead>
                    <TableHead>Work Name</TableHead>
                    <TableHead>Estimate (₹)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Commencement</TableHead>
                    <TableHead>Completion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {works.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        No works found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    works.map((work) => (
                      <TableRow key={work.id}>
                        <TableCell>
                          {work.ApprovedActionPlanDetails?.activityCode}
                        </TableCell>
                        <TableCell>
                          {work.ApprovedActionPlanDetails?.activityDescription}
                        </TableCell>
                        <TableCell>₹{work.finalEstimateAmount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{work.workStatus}</Badge>
                        </TableCell>
                        <TableCell>
                          {work.workCommencementDate
                            ? format(work.workCommencementDate, "PP")
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {work.completionDate
                            ? format(work.completionDate, "PP")
                            : "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AOC Tab */}
        <TabsContent value="aocs">
          <Card>
            <CardHeader>
              <CardTitle>Award of Contract (AOC)</CardTitle>
              <CardDescription>Your contracts and work orders.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Memo Number</TableHead>
                    <TableHead>Memo Date</TableHead>
                    <TableHead>Delivery Date</TableHead>
                    <TableHead>Is Delivery</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {aocs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-4">
                        No AOCs found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    aocs.map((aoc) => (
                      <TableRow key={aoc.id}>
                        <TableCell>{aoc.workodermenonumber}</TableCell>
                        <TableCell>{format(aoc.workordeermemodate, "PP")}</TableCell>
                        <TableCell>
                          {aoc.deliveryDate ? format(aoc.deliveryDate, "PP") : "—"}
                        </TableCell>
                        <TableCell>{aoc.isdelivery ? "Yes" : "No"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payments Tab */}
        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
              <CardDescription>Summary of payments received.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Voucher #</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Bill Type</TableHead>
                    <TableHead>Gross (₹)</TableHead>
                    <TableHead>Net (₹)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Final Bill</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4">
                        No payments found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{payment.eGramVoucher}</TableCell>
                        <TableCell>
                          {format(payment.eGramVoucherDate, "PP")}
                        </TableCell>
                        <TableCell>{payment.billType}</TableCell>
                        <TableCell>₹{payment.grossBillAmount.toLocaleString()}</TableCell>
                        <TableCell>₹{payment.netAmt.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={payment.isVerified ? "default" : "secondary"}>
                            {payment.isVerified ? "Verified" : "Pending"}
                          </Badge>
                        </TableCell>
                        <TableCell>{payment.isfinalbill ? "Yes" : "No"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Orders Tab */}
        <TabsContent value="orders">
          <Card>
            <CardHeader>
              <CardTitle>Orders</CardTitle>
              <CardDescription>Purchase orders issued to you.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order No</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount (₹)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment Status</TableHead>
                    <TableHead>Completion</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        No orders found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>{order.orderNo}</TableCell>
                        <TableCell>{format(order.orderDate, "PP")}</TableCell>
                        <TableCell>₹{order.orderAmount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{order.status}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{order.paymentStatus}</Badge>
                        </TableCell>
                        <TableCell>{order.completionPercentage}%</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bids Tab */}
        <TabsContent value="bids">
          <Card>
            <CardHeader>
              <CardTitle>Quotation Bids</CardTitle>
              <CardDescription>Bids submitted for quotations.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Quotation No</TableHead>
                    <TableHead>Work Name</TableHead>
                    <TableHead>Bid Amount (₹)</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Rank</TableHead>
                    <TableHead>Selected</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bids.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        No bids found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    bids.map((bid) => (
                      <TableRow key={bid.id}>
                        <TableCell>{bid.quotation?.nitNo}</TableCell>
                        <TableCell>{bid.quotation?.workName}</TableCell>
                        <TableCell>₹{bid.amount.toLocaleString()}</TableCell>
                        <TableCell>{format(bid.submittedAt, "PP")}</TableCell>
                        <TableCell>{bid.rank ?? "—"}</TableCell>
                        <TableCell>{bid.isSelected ? "Yes" : "No"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Earnest Money Tab */}
        <TabsContent value="earnest">
          <Card>
            <CardHeader>
              <CardTitle>Earnest Money Register</CardTitle>
              <CardDescription>EMD payments and status.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Amount (₹)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment Date</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Cheque No</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {earnestMoneyRecords.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        No earnest money records.
                      </TableCell>
                    </TableRow>
                  ) : (
                    earnestMoneyRecords.map((em) => (
                      <TableRow key={em.id}>
                        <TableCell>₹{em.earnestMoneyAmount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{em.paymentstatus}</Badge>
                        </TableCell>
                        <TableCell>
                          {em.paymentDate ? format(em.paymentDate, "PP") : "—"}
                        </TableCell>
                        <TableCell>{em.paymentMethod || "—"}</TableCell>
                        <TableCell>{em.chequeNumber || "—"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Technical Evaluations Tab */}
        <TabsContent value="tech">
          <Card>
            <CardHeader>
              <CardTitle>Technical Evaluation Documents</CardTitle>
              <CardDescription>
                Submitted documents for technical evaluation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Credentials</TableHead>
                    <TableHead>Validity</TableHead>
                    <TableHead>Bye‑law</TableHead>
                    <TableHead>PF Challan</TableHead>
                    <TableHead>Declaration</TableHead>
                    <TableHead>Machinery</TableHead>
                    <TableHead>Qualify</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {technicalEvals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-4">
                        No technical evaluation records.
                      </TableCell>
                    </TableRow>
                  ) : (
                    technicalEvals.map((te) => (
                      <TableRow key={te.id}>
                        <TableCell>
                          <Badge variant="outline">
                            {te.credencial
                              ? `60%:${te.credencial.sixtyperamtput}`
                              : "—"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {te.validityofdocument ? (
                            <span className="text-xs">
                              ITR:{te.validityofdocument.itreturn ? "✓" : "✗"} GST:
                              {te.validityofdocument.gst ? "✓" : "✗"}
                            </span>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>{te.byelow ? "Yes" : "No"}</TableCell>
                        <TableCell>
                          {te.pfregistrationupdatechalan ? "Yes" : "No"}
                        </TableCell>
                        <TableCell>{te.declaration ? "Yes" : "No"}</TableCell>
                        <TableCell>{te.machinary ? "Yes" : "No"}</TableCell>
                        <TableCell>{te.qualify ? "Yes" : "No"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Agency Users</CardTitle>
              <CardDescription>User accounts linked to this agency.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Mobile</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-4">
                        No users linked.
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>{u.name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{u.mobileNumber}</TableCell>
                        <TableCell>{u.role}</TableCell>
                        <TableCell>
                          <Badge variant={u.userStatus === "active" ? "default" : "secondary"}>
                            {u.userStatus}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function AgencyDashboardPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading dashboard...</div>}>
      <AgencyDashboardContent />
    </Suspense>
  );
}
