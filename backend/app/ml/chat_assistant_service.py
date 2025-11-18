# app/ml/chat_assistant_service.py
"""
Chat Assistant Service for natural language financial queries.

This service implements an AI-powered conversational assistant that can:
- Answer questions about financial data
- Generate insights and reports
- Provide recommendations
- Help with financial planning
- Execute queries in natural language
"""
import json
import re
from typing import List, Dict, Any, Optional, Tuple
from uuid import UUID
from datetime import datetime, date, timedelta, timezone
from enum import Enum

from sqlalchemy.orm import Session
from sqlalchemy import and_, func, desc

from app.models.chat import ChatConversation, ChatMessage, MessageRole
from app.models.transaction import Transaction
from app.models.category import Category
from app.models.account import Account
from app.models.budget import Budget
from app.models.financial_goal import FinancialGoal


class QueryIntent(str, Enum):
    """Types of user query intents"""
    BALANCE_QUERY = "balance_query"
    SPENDING_ANALYSIS = "spending_analysis"
    BUDGET_STATUS = "budget_status"
    TRANSACTION_SEARCH = "transaction_search"
    CATEGORY_BREAKDOWN = "category_breakdown"
    GOAL_STATUS = "goal_status"
    FORECAST_REQUEST = "forecast_request"
    RECOMMENDATION_REQUEST = "recommendation_request"
    COMPARISON = "comparison"
    GENERAL_QUESTION = "general_question"


class ChatAssistantService:
    """
    AI-powered Chat Assistant for financial queries.

    Features:
    - Natural language understanding
    - Context-aware responses
    - Data visualization suggestions
    - Proactive insights
    - Conversational memory
    """

    def __init__(self, db: Session):
        """
        Initialize the Chat Assistant Service.

        Args:
            db: Database session
        """
        self.db = db

    async def process_message(
        self,
        user_id: UUID,
        financial_profile_id: Optional[UUID],
        message_content: str,
        conversation_id: Optional[UUID] = None
    ) -> Dict[str, Any]:
        """
        Process a user message and generate a response.

        Args:
            user_id: User ID
            financial_profile_id: Financial profile context
            message_content: User's message
            conversation_id: Existing conversation ID (or None for new)

        Returns:
            Dictionary with response and metadata
        """
        # Get or create conversation
        if conversation_id:
            conversation = self.db.query(ChatConversation).filter(
                ChatConversation.id == conversation_id
            ).first()
        else:
            # Create new conversation
            conversation = ChatConversation(
                user_id=user_id,
                financial_profile_id=financial_profile_id,
                title=self._generate_conversation_title(message_content)
            )
            self.db.add(conversation)
            self.db.commit()
            self.db.refresh(conversation)

        # Save user message
        user_message = ChatMessage(
            conversation_id=conversation.id,
            role=MessageRole.USER,
            content=message_content
        )
        self.db.add(user_message)
        self.db.commit()

        # Parse intent
        intent = self._parse_intent(message_content)

        # Get conversation history for context
        history = self._get_conversation_history(conversation.id, limit=10)

        # Generate response based on intent
        response_content, metadata = await self._generate_response(
            intent,
            message_content,
            financial_profile_id,
            history
        )

        # Save assistant message
        assistant_message = ChatMessage(
            conversation_id=conversation.id,
            role=MessageRole.ASSISTANT,
            content=response_content,
            message_metadata=metadata
        )
        self.db.add(assistant_message)
        self.db.commit()

        return {
            "conversation_id": str(conversation.id),
            "message_id": str(assistant_message.id),
            "content": response_content,
            "metadata": metadata,
            "intent": intent.value
        }

    def _generate_conversation_title(self, first_message: str) -> str:
        """Generate a title from the first message."""
        # Take first 50 characters or until first question mark/period
        title = first_message[:50]
        if '?' in title:
            title = title[:title.index('?') + 1]
        elif '.' in title:
            title = title[:title.index('.') + 1]

        return title.strip()

    def _parse_intent(self, message: str) -> QueryIntent:
        """
        Parse user intent from message.

        This is a simple rule-based parser. In production, you'd use
        a more sophisticated NLU model.
        """
        message_lower = message.lower()

        # Balance queries
        if any(word in message_lower for word in ['saldo', 'balance', 'quanto ho']):
            return QueryIntent.BALANCE_QUERY

        # Spending analysis
        if any(word in message_lower for word in ['speso', 'spesa', 'spending', 'uscite']):
            return QueryIntent.SPENDING_ANALYSIS

        # Budget status
        if any(word in message_lower for word in ['budget', 'limite']):
            return QueryIntent.BUDGET_STATUS

        # Transaction search
        if any(word in message_lower for word in ['transazione', 'pagamento', 'acquisto', 'cerca']):
            return QueryIntent.TRANSACTION_SEARCH

        # Category breakdown
        if any(word in message_lower for word in ['categoria', 'categorie', 'ripartizione']):
            return QueryIntent.CATEGORY_BREAKDOWN

        # Goal status
        if any(word in message_lower for word in ['obiettivo', 'goal', 'risparmio']):
            return QueryIntent.GOAL_STATUS

        # Forecast
        if any(word in message_lower for word in ['previsione', 'forecast', 'futuro', 'proiezione']):
            return QueryIntent.FORECAST_REQUEST

        # Recommendations
        if any(word in message_lower for word in ['consiglio', 'suggerimento', 'raccomandazione', 'advice']):
            return QueryIntent.RECOMMENDATION_REQUEST

        # Comparison
        if any(word in message_lower for word in ['confronta', 'compare', 'differenza', 'rispetto']):
            return QueryIntent.COMPARISON

        return QueryIntent.GENERAL_QUESTION

    def _get_conversation_history(
        self,
        conversation_id: UUID,
        limit: int = 10
    ) -> List[ChatMessage]:
        """Get recent conversation history."""
        return self.db.query(ChatMessage).filter(
            ChatMessage.conversation_id == conversation_id
        ).order_by(desc(ChatMessage.timestamp)).limit(limit).all()

    async def _generate_response(
        self,
        intent: QueryIntent,
        message: str,
        financial_profile_id: Optional[UUID],
        history: List[ChatMessage]
    ) -> Tuple[str, Dict[str, Any]]:
        """
        Generate response based on intent.

        Returns:
            Tuple of (response_text, metadata_dict)
        """
        if not financial_profile_id:
            return (
                "Per rispondere alla tua domanda, devo sapere quale profilo finanziario vuoi analizzare. "
                "Puoi selezionare un profilo dalle impostazioni.",
                {}
            )

        # Route to specific handler based on intent
        if intent == QueryIntent.BALANCE_QUERY:
            return await self._handle_balance_query(financial_profile_id, message)

        elif intent == QueryIntent.SPENDING_ANALYSIS:
            return await self._handle_spending_analysis(financial_profile_id, message)

        elif intent == QueryIntent.BUDGET_STATUS:
            return await self._handle_budget_status(financial_profile_id, message)

        elif intent == QueryIntent.TRANSACTION_SEARCH:
            return await self._handle_transaction_search(financial_profile_id, message)

        elif intent == QueryIntent.CATEGORY_BREAKDOWN:
            return await self._handle_category_breakdown(financial_profile_id, message)

        elif intent == QueryIntent.GOAL_STATUS:
            return await self._handle_goal_status(financial_profile_id, message)

        elif intent == QueryIntent.FORECAST_REQUEST:
            return await self._handle_forecast_request(financial_profile_id, message)

        elif intent == QueryIntent.RECOMMENDATION_REQUEST:
            return await self._handle_recommendation_request(financial_profile_id, message)

        elif intent == QueryIntent.COMPARISON:
            return await self._handle_comparison(financial_profile_id, message)

        else:
            return await self._handle_general_question(message)

    async def _handle_balance_query(
        self,
        financial_profile_id: UUID,
        message: str
    ) -> Tuple[str, Dict[str, Any]]:
        """Handle balance query."""
        # Get all active accounts
        accounts = self.db.query(Account).filter(
            and_(
                Account.financial_profile_id == financial_profile_id,
                Account.is_active == True
            )
        ).all()

        if not accounts:
            return ("Non hai ancora conti attivi in questo profilo.", {})

        total_balance = sum(float(acc.current_balance or 0) for acc in accounts)

        # Generate response
        response = f"Il tuo saldo totale è di €{total_balance:,.2f}\n\n"
        response += "Dettaglio per conto:\n"

        account_data = []
        for acc in accounts:
            balance = float(acc.current_balance or 0)
            response += f"- {acc.name}: €{balance:,.2f}\n"
            account_data.append({
                "name": acc.name,
                "balance": balance,
                "type": acc.account_type.value if acc.account_type else "UNKNOWN"
            })

        metadata = {
            "chart_type": "pie",
            "chart_data": account_data,
            "total_balance": total_balance
        }

        return (response, metadata)

    async def _handle_spending_analysis(
        self,
        financial_profile_id: UUID,
        message: str
    ) -> Tuple[str, Dict[str, Any]]:
        """Handle spending analysis query."""
        # Extract time period from message (default to current month)
        start_date, end_date = self._extract_date_range(message)

        # Get transactions for period
        transactions = self.db.query(Transaction).join(
            Account
        ).filter(
            and_(
                Account.financial_profile_id == financial_profile_id,
                Transaction.transaction_date >= start_date,
                Transaction.transaction_date <= end_date,
                Transaction.amount < 0  # Only expenses
            )
        ).all()

        if not transactions:
            return (
                f"Non ci sono spese registrate nel periodo dal {start_date} al {end_date}.",
                {}
            )

        total_spending = sum(abs(float(txn.amount or 0)) for txn in transactions)
        avg_daily_spending = total_spending / ((end_date - start_date).days + 1)

        response = f"Analisi spese dal {start_date} al {end_date}:\n\n"
        response += f"💰 Spesa totale: €{total_spending:,.2f}\n"
        response += f"📊 Spesa media giornaliera: €{avg_daily_spending:,.2f}\n"
        response += f"📝 Numero transazioni: {len(transactions)}\n"

        # Category breakdown
        category_spending = {}
        for txn in transactions:
            if txn.category_id:
                category = self.db.query(Category).filter(
                    Category.id == txn.category_id
                ).first()
                cat_name = category.name if category else "Senza categoria"
            else:
                cat_name = "Senza categoria"

            if cat_name not in category_spending:
                category_spending[cat_name] = 0
            category_spending[cat_name] += abs(float(txn.amount or 0))

        if category_spending:
            response += "\n📋 Per categoria:\n"
            sorted_categories = sorted(
                category_spending.items(),
                key=lambda x: x[1],
                reverse=True
            )
            for cat_name, amount in sorted_categories[:5]:
                percentage = (amount / total_spending) * 100
                response += f"- {cat_name}: €{amount:,.2f} ({percentage:.1f}%)\n"

        metadata = {
            "chart_type": "bar",
            "chart_data": [
                {"category": cat, "amount": amt}
                for cat, amt in sorted_categories
            ],
            "total_spending": total_spending,
            "period": {"start": str(start_date), "end": str(end_date)}
        }

        return (response, metadata)

    async def _handle_budget_status(
        self,
        financial_profile_id: UUID,
        message: str
    ) -> Tuple[str, Dict[str, Any]]:
        """Handle budget status query."""
        # Get active budgets
        budgets = self.db.query(Budget).filter(
            and_(
                Budget.financial_profile_id == financial_profile_id,
                Budget.is_active == True
            )
        ).all()

        if not budgets:
            return ("Non hai budget attivi al momento.", {})

        response = "Stato dei tuoi budget:\n\n"
        budget_data = []

        for budget in budgets:
            # Calculate spent amount
            # This is simplified - in production you'd need to calculate actual spending
            # based on budget categories and date range
            budget_amount = float(budget.amount or 0)
            spent = 0.0  # TODO: Calculate actual spending

            remaining = budget_amount - spent
            percentage_used = (spent / budget_amount * 100) if budget_amount > 0 else 0

            status_emoji = "✅" if percentage_used < 80 else "⚠️" if percentage_used < 100 else "🔴"

            response += f"{status_emoji} {budget.name}\n"
            response += f"   Budget: €{budget_amount:,.2f}\n"
            response += f"   Speso: €{spent:,.2f} ({percentage_used:.1f}%)\n"
            response += f"   Rimanente: €{remaining:,.2f}\n\n"

            budget_data.append({
                "name": budget.name,
                "budget": budget_amount,
                "spent": spent,
                "remaining": remaining,
                "percentage": percentage_used
            })

        metadata = {
            "chart_type": "progress",
            "chart_data": budget_data
        }

        return (response, metadata)

    async def _handle_transaction_search(
        self,
        financial_profile_id: UUID,
        message: str
    ) -> Tuple[str, Dict[str, Any]]:
        """Handle transaction search query."""
        # Extract search terms from message
        search_terms = self._extract_search_terms(message)

        if not search_terms:
            return (
                "Non ho capito cosa vuoi cercare. Puoi essere più specifico? "
                "Ad esempio: 'cerca transazioni Amazon' o 'trova pagamenti di ottobre'",
                {}
            )

        # Search transactions
        query = self.db.query(Transaction).join(Account).filter(
            Account.financial_profile_id == financial_profile_id
        )

        # Apply search filters
        for term in search_terms:
            query = query.filter(
                (Transaction.description.ilike(f"%{term}%")) |
                (Transaction.merchant_name.ilike(f"%{term}%"))
            )

        transactions = query.order_by(desc(Transaction.transaction_date)).limit(10).all()

        if not transactions:
            return (f"Non ho trovato transazioni che corrispondono a: {', '.join(search_terms)}", {})

        response = f"Ho trovato {len(transactions)} transazioni:\n\n"

        for txn in transactions:
            amount = float(txn.amount or 0)
            amount_str = f"€{amount:,.2f}" if amount >= 0 else f"-€{abs(amount):,.2f}"
            response += f"📅 {txn.transaction_date} - {txn.description or 'N/A'} - {amount_str}\n"

        metadata = {
            "transactions": [
                {
                    "id": str(txn.id),
                    "date": str(txn.transaction_date),
                    "description": txn.description,
                    "amount": float(txn.amount or 0)
                }
                for txn in transactions
            ]
        }

        return (response, metadata)

    async def _handle_category_breakdown(
        self,
        financial_profile_id: UUID,
        message: str
    ) -> Tuple[str, Dict[str, Any]]:
        """Handle category breakdown query."""
        start_date, end_date = self._extract_date_range(message)

        # Get spending by category
        transactions = self.db.query(Transaction).join(Account).filter(
            and_(
                Account.financial_profile_id == financial_profile_id,
                Transaction.transaction_date >= start_date,
                Transaction.transaction_date <= end_date,
                Transaction.amount < 0
            )
        ).all()

        if not transactions:
            return (f"Nessuna spesa nel periodo dal {start_date} al {end_date}.", {})

        # Group by category
        category_totals = {}
        for txn in transactions:
            if txn.category_id:
                category = self.db.query(Category).filter(Category.id == txn.category_id).first()
                cat_name = category.name if category else "Senza categoria"
            else:
                cat_name = "Senza categoria"

            if cat_name not in category_totals:
                category_totals[cat_name] = 0
            category_totals[cat_name] += abs(float(txn.amount or 0))

        total = sum(category_totals.values())

        response = f"Ripartizione spese per categoria ({start_date} - {end_date}):\n\n"

        sorted_categories = sorted(category_totals.items(), key=lambda x: x[1], reverse=True)

        for cat_name, amount in sorted_categories:
            percentage = (amount / total * 100) if total > 0 else 0
            response += f"• {cat_name}: €{amount:,.2f} ({percentage:.1f}%)\n"

        metadata = {
            "chart_type": "pie",
            "chart_data": [
                {"category": cat, "amount": amt, "percentage": (amt/total*100) if total > 0 else 0}
                for cat, amt in sorted_categories
            ],
            "total": total
        }

        return (response, metadata)

    async def _handle_goal_status(
        self,
        financial_profile_id: UUID,
        message: str
    ) -> Tuple[str, Dict[str, Any]]:
        """Handle goal status query."""
        goals = self.db.query(FinancialGoal).filter(
            and_(
                FinancialGoal.financial_profile_id == financial_profile_id,
                FinancialGoal.status == "ACTIVE"
            )
        ).all()

        if not goals:
            return ("Non hai obiettivi di risparmio attivi.", {})

        response = "I tuoi obiettivi di risparmio:\n\n"
        goal_data = []

        for goal in goals:
            target = float(goal.target_amount or 0)
            current = float(goal.current_amount or 0)
            percentage = (current / target * 100) if target > 0 else 0

            response += f"🎯 {goal.name}\n"
            response += f"   Obiettivo: €{target:,.2f}\n"
            response += f"   Raggiunto: €{current:,.2f} ({percentage:.1f}%)\n"

            if goal.target_date:
                days_remaining = (goal.target_date - date.today()).days
                if days_remaining > 0:
                    required_monthly = (target - current) / (days_remaining / 30) if days_remaining > 0 else 0
                    response += f"   Scadenza: {goal.target_date} ({days_remaining} giorni)\n"
                    response += f"   Risparmio mensile richiesto: €{required_monthly:,.2f}\n"

            response += "\n"

            goal_data.append({
                "name": goal.name,
                "target": target,
                "current": current,
                "percentage": percentage
            })

        metadata = {
            "chart_type": "progress",
            "chart_data": goal_data
        }

        return (response, metadata)

    async def _handle_forecast_request(
        self,
        financial_profile_id: UUID,
        message: str
    ) -> Tuple[str, Dict[str, Any]]:
        """Handle forecast request."""
        return (
            "Le previsioni finanziarie sono disponibili nella sezione dedicata. "
            "Vuoi che ti mostri una panoramica rapida del tuo cashflow previsto?",
            {"action": "redirect_to_forecast"}
        )

    async def _handle_recommendation_request(
        self,
        financial_profile_id: UUID,
        message: str
    ) -> Tuple[str, Dict[str, Any]]:
        """Handle recommendation request."""
        # Generate simple recommendations based on data
        recommendations = []

        # Check for high spending categories
        start_date = date.today().replace(day=1)  # First day of current month
        end_date = date.today()

        transactions = self.db.query(Transaction).join(Account).filter(
            and_(
                Account.financial_profile_id == financial_profile_id,
                Transaction.transaction_date >= start_date,
                Transaction.transaction_date <= end_date,
                Transaction.amount < 0
            )
        ).all()

        if transactions:
            total_spending = sum(abs(float(txn.amount or 0)) for txn in transactions)
            avg_transaction = total_spending / len(transactions)

            recommendations.append(
                f"💡 Questo mese hai speso in media €{avg_transaction:.2f} per transazione. "
                "Considera di impostare limiti di spesa per categorie specifiche."
            )

        response = "Ecco alcuni consigli per te:\n\n"
        response += "\n\n".join(recommendations) if recommendations else "Al momento non ho consigli specifici da darti."

        return (response, {"recommendations": recommendations})

    async def _handle_comparison(
        self,
        financial_profile_id: UUID,
        message: str
    ) -> Tuple[str, Dict[str, Any]]:
        """Handle comparison request."""
        # Extract periods to compare from message
        # This is simplified - in production you'd use better NLP

        current_month = date.today().replace(day=1)
        last_month = (current_month - timedelta(days=1)).replace(day=1)

        # Get current month spending
        current_spending = await self._get_period_spending(
            financial_profile_id,
            current_month,
            date.today()
        )

        # Get last month spending
        last_month_end = current_month - timedelta(days=1)
        last_spending = await self._get_period_spending(
            financial_profile_id,
            last_month,
            last_month_end
        )

        difference = current_spending - last_spending
        percentage_change = (difference / last_spending * 100) if last_spending > 0 else 0

        response = f"Confronto spese:\n\n"
        response += f"📅 Mese corrente: €{current_spending:,.2f}\n"
        response += f"📅 Mese scorso: €{last_spending:,.2f}\n\n"

        if difference > 0:
            response += f"📈 Hai speso €{difference:,.2f} in più ({percentage_change:.1f}%)"
        elif difference < 0:
            response += f"📉 Hai speso €{abs(difference):,.2f} in meno ({abs(percentage_change):.1f}%)"
        else:
            response += "➡️ La spesa è rimasta stabile"

        metadata = {
            "comparison": {
                "current": current_spending,
                "previous": last_spending,
                "difference": difference,
                "percentage_change": percentage_change
            }
        }

        return (response, metadata)

    async def _handle_general_question(self, message: str) -> Tuple[str, Dict[str, Any]]:
        """Handle general questions."""
        return (
            "Posso aiutarti con:\n"
            "• Consultare il tuo saldo\n"
            "• Analizzare le tue spese\n"
            "• Verificare lo stato dei budget\n"
            "• Cercare transazioni\n"
            "• Visualizzare i tuoi obiettivi di risparmio\n"
            "• Confrontare periodi diversi\n\n"
            "Cosa vorresti sapere?",
            {}
        )

    def _extract_date_range(self, message: str) -> Tuple[date, date]:
        """
        Extract date range from message.
        Default to current month if not specified.
        """
        message_lower = message.lower()

        # Check for specific month mentions
        months = {
            'gennaio': 1, 'febbraio': 2, 'marzo': 3, 'aprile': 4,
            'maggio': 5, 'giugno': 6, 'luglio': 7, 'agosto': 8,
            'settembre': 9, 'ottobre': 10, 'novembre': 11, 'dicembre': 12
        }

        for month_name, month_num in months.items():
            if month_name in message_lower:
                year = date.today().year
                start = date(year, month_num, 1)
                if month_num == 12:
                    end = date(year + 1, 1, 1) - timedelta(days=1)
                else:
                    end = date(year, month_num + 1, 1) - timedelta(days=1)
                return start, end

        # Check for "last month"
        if 'scorso' in message_lower or 'passato' in message_lower:
            current_month = date.today().replace(day=1)
            end = current_month - timedelta(days=1)
            start = end.replace(day=1)
            return start, end

        # Default to current month
        today = date.today()
        start = today.replace(day=1)
        return start, today

    def _extract_search_terms(self, message: str) -> List[str]:
        """Extract search terms from message."""
        # Remove common words
        common_words = {'cerca', 'trova', 'mostra', 'mi', 'le', 'i', 'di', 'per', 'transazioni', 'pagamenti'}

        words = re.findall(r'\w+', message.lower())
        search_terms = [w for w in words if w not in common_words and len(w) > 2]

        return search_terms

    async def _get_period_spending(
        self,
        financial_profile_id: UUID,
        start_date: date,
        end_date: date
    ) -> float:
        """Get total spending for a period."""
        result = self.db.query(func.sum(Transaction.amount)).join(Account).filter(
            and_(
                Account.financial_profile_id == financial_profile_id,
                Transaction.transaction_date >= start_date,
                Transaction.transaction_date <= end_date,
                Transaction.amount < 0
            )
        ).scalar()

        return abs(float(result)) if result else 0.0
