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


# County of Santa Barbara Zero Emission Vehicle Plan context
ZEV_PLAN_CONTEXT = '''
County of Santa Barbara Zero-Emission Vehicle Plan (ZEVP)
2030 Climate Action Plan (CAP) aims to reduce community-wide emissions 50% by 2030 (below 2018 levels).
On-road vehicle transportation accounts for 48% of the County’s GHG emissions. As of 2022, ZEVs make up less than 2% of all vehicles on the road in Santa Barbara County.
The ZEV Plan supports the transition to zero-emission transportation and increases access to clean mobility options. It identifies gaps, barriers, and challenges to planning, education, and infrastructure deployment, and develops strategies to meet internal county operations and community needs.
The plan also identifies opportunities to increase equitable adoption of clean transportation modes including electric vehicles (EVs), electrified transit, micro-mobility and shared mobility devices and services, and emerging technologies.
Action categories include Planning and Policy, Infrastructure Deployment, Programmatic Actions, and Outreach, Education, & Engagement.
Example actions: require charging infrastructure in new buildings, conduct mobility needs assessments, create EV charging station manuals, install EV stations, expand shared mobility pilots, workplace charging programs, pilot fleet electrification, battery recycling, and equitable workforce development.
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
        Extract all the names of stakeholders mentioned in the following meeting chat transcript about the County of Santa Barbara Zero Emission Vehicle Plan and related activities. Only return a Python list of names, no explanation.
        Transcript:
        {chat_text}
        """
        llm = ChatOpenAI(model_name="gpt-3.5-turbo", temperature=0)
        stakeholder_names = []
        try:
            response = llm([HumanMessage(content=stakeholder_prompt)])
            import ast
            stakeholder_names = ast.literal_eval(response.content)
        except Exception as e:
            return Response({'error': f'LLM error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        # Step 3: Summarize follow-up for each stakeholder
        followups = []
        for name in stakeholder_names:
            followup_prompt = f"""
            You are a sustainability and clean transportation specialist for Santa Barbara County. Based on the transcript below and the county context, write a very short follow-up email for {name} summarizing what they asked about and how the County's Zero Emission Vehicle Plan and related programs can help. Be concise, friendly, and reference relevant ZEV plan actions if possible.
            Transcript:
            {chat_text}
            County context:
            {ZEV_PLAN_CONTEXT}
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
