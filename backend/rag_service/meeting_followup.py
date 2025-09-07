from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
import tempfile
import os

# For LLM processing
from langchain.chat_models import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.schema import HumanMessage

# Company context for Innergy
INNERGY_ABOUT = '''
We’re a new take on Woodworking ERP
From our modern cloud-based software to our focus on education and community, INNERGY is different because of our people and our DNA.

For woodworkers, by woodworkers
We’ve lived the complexity of scheduling and delivery.
Experienced
We’ve experienced the chaos of no standardization. And we fully appreciate that things are stuck in engineering.

Focus
That’s why we focus not just on building amazing software, but on successful implementations, as well as ongoing education that supports you and your business.

Our People
We’re building the best team around.
With hundreds of years of combined woodworking expertise, we leverage our team’s extensive experience to help our customers grow.

Our Process
Adopting new tech, particularly core ERP, is a challenge that we meet head-on with every business that we partner with.

We support implementation start to finish
We help you customize our software to your operations
We provide on-going education at no extra cost
Our Values
We are driven by our values and committed to your success.

Voice of the Customer
It all starts and ends with the customer. We want to change how people work and thrive within their industry.

Education
INNERGY is more than just software. We listen, learn, and teach. We’re an educational leader in the industry.

Agile as Hell
We all make mistakes and are committed to fast improvement over delayed perfection. We are ready for change and push forward, try new things and find new solutions.

Transparency
Great companies are created by sharing knowledge. We practice honest, vulnerable communication and we build trust and equity with our customers.

Problem / Solution
We always run towards the problem and tackle it head on, and our team is passionate about finding solutions to the problems woodworkers face. 

Quality
Our clients rely on us and we are proud of what we do at the end of the day. We deliver as if we are the recipient.
'''

class MeetingFollowupAPIView(APIView):
    permission_classes = [AllowAny]
    from rest_framework.parsers import MultiPartParser, FormParser
    parser_classes = [MultiPartParser, FormParser]

    @method_decorator(csrf_exempt)
    def post(self, request):
        uploaded_file = request.FILES.get('file')
        if not uploaded_file:
            return Response({'error': 'No file uploaded.'}, status=status.HTTP_400_BAD_REQUEST)
        # Read file contents
        chat_text = uploaded_file.read().decode('utf-8')
        # Step 2: Extract stakeholder names
        stakeholder_prompt = f"""
        Extract all the names of stakeholders mentioned in the following Zoom meeting chat transcript. Only return a Python list of names, no explanation.
        Transcript:
        {chat_text}
        """
        llm = ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0)
        stakeholder_names = []
        try:
            response = llm([HumanMessage(content=stakeholder_prompt)])
            # Try to parse names from response
            import ast
            stakeholder_names = ast.literal_eval(response.content)
        except Exception as e:
            return Response({'error': f'LLM error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        # Step 3: Summarize follow-up for each stakeholder
        followups = []
        for name in stakeholder_names:
            followup_prompt = f"""
            You are a sales rep for Innergy, a modern cloud-based ERP for woodworkers. Based on the transcript below and the company context, write a very short follow-up email for {name} summarizing what they asked about and how Innergy can help. Be concise and friendly.
            Transcript:
            {chat_text}
            Company context:
            {INNERGY_ABOUT}
            """
            try:
                followup_response = llm([HumanMessage(content=followup_prompt)])
                followups.append({
                    'name': name,
                    'email': followup_response.content.strip()
                })
            except Exception as e:
                followups.append({
                    'name': name,
                    'email': f'Error generating email: {str(e)}'
                })
        return Response({
            'stakeholders': stakeholder_names,
            'followups': followups
        }, status=status.HTTP_200_OK)
