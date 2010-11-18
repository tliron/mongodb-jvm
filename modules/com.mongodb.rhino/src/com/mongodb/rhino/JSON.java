/**
 * Copyright 2010 Three Crickets LLC.
 * <p>
 * The contents of this file are subject to the terms of either the MPL version
 * 1.1 or the GPL version 2.0: http://www.opensource.org/licenses/mozilla1.1.php
 * http://www.opensource.org/licenses/gpl-license.html
 * <p>
 * Alternatively, you can obtain a royalty free commercial license with less
 * limitations, transferable or non-transferable, directly from Three Crickets
 * at http://threecrickets.com/
 */

package com.mongodb.rhino;

import java.util.Collection;
import java.util.Date;
import java.util.HashMap;
import java.util.Iterator;
import java.util.Map;

import org.bson.types.ObjectId;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.NativeArray;
import org.mozilla.javascript.NativeJavaObject;
import org.mozilla.javascript.ScriptRuntime;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;

import com.mongodb.rhino.util.JSONException;
import com.mongodb.rhino.util.JSONTokener;

/**
 * Direct conversion between native Rhino objects and JSON.
 * <p>
 * This class can be used directly in Rhino.
 * 
 * @author Tal Liron
 */
public class JSON
{
	//
	// Static operations
	//

	/**
	 * Recursively convert from JSON into native Rhino types.
	 * <p>
	 * Creates JavaScript objects, arrays and primitives.
	 * 
	 * @param json
	 *        The JSON string
	 * @return A Rhino object or array
	 * @throws JSONException
	 */
	public static Object from( String json ) throws JSONException
	{
		return from( json, false );
	}

	/**
	 * Recursively convert from JSON into native Rhino types.
	 * <p>
	 * Creates JavaScript objects, arrays and primitives.
	 * <p>
	 * Can also optionally recognize and create JavaScript date and MongoDB
	 * ObjectId objects.
	 * 
	 * @param json
	 *        The JSON string
	 * @param convertSpecial
	 *        Whether to convert special "$" objects
	 * @return A Rhino object or array
	 * @throws JSONException
	 */
	public static Object from( String json, boolean convertSpecial ) throws JSONException
	{
		JSONTokener tokener = new JSONTokener( json );
		Object object = tokener.createNative();
		if( convertSpecial )
		{
			object = convertSpecial( object );
		}
		return object;
	}

	/**
	 * Recursively convert from native Rhino to JSON.
	 * <p>
	 * Recognizes JavaScript objects, arrays and primitives.
	 * <p>
	 * Special support for JavaScript dates: converts to {"$date": timestamp} in
	 * JSON.
	 * <p>
	 * Special support for MongoDB ObjectId: converts to {"$oid": "objectid"} in
	 * JSON.
	 * <p>
	 * Also recognizes JVM types: java.util.Map, java.util.Collection,
	 * java.util.Date.
	 * 
	 * @param object
	 *        A Rhino native object
	 * @return The JSON string
	 * @see JSON#convertSpecial(Object)
	 */
	public static String to( Object object )
	{
		return to( object, false );
	}

	/**
	 * Recursively convert from native Rhino to JSON.
	 * <p>
	 * Recognizes JavaScript objects, arrays and primitives.
	 * <p>
	 * Special support for JavaScript dates: converts to {"$date": timestamp} in
	 * JSON.
	 * <p>
	 * Special support for MongoDB ObjectId: converts to {"$oid": "objectid"} in
	 * JSON.
	 * <p>
	 * Also recognizes JVM types: java.util.Map, java.util.Collection,
	 * java.util.Date.
	 * 
	 * @param object
	 *        A Rhino native object
	 * @param indent
	 *        Whether to indent the JSON for human readability
	 * @return The JSON string
	 */
	public static String to( Object object, boolean indent )
	{
		StringBuilder s = new StringBuilder();
		encode( s, object, indent, indent ? 0 : -1 );

		return s.toString();
	}

	/**
	 * Recursively converts special JavaScript objects.
	 * <p>
	 * Converts {$date: timestamp} objects to JavaScript date objects.
	 * <p>
	 * Converts {$oid: 'objectid'} objects to MongoDB ObjectId objects.
	 * 
	 * @param object
	 *        A native Rhino object or array
	 * @return The converted object or the original
	 */
	public static Object convertSpecial( Object object )
	{
		if( object instanceof NativeArray )
		{
			NativeArray array = (NativeArray) object;
			int length = (int) array.getLength();

			for( int i = 0; i < length; i++ )
			{
				Object value = ScriptableObject.getProperty( array, i );
				Object converted = convertSpecial( value );
				if( converted != value )
					ScriptableObject.putProperty( array, i, converted );
			}
		}
		else if( object instanceof ScriptableObject )
		{
			ScriptableObject scriptable = (ScriptableObject) object;

			Object oid = ScriptableObject.getProperty( scriptable, "$oid" );
			if( oid != Scriptable.NOT_FOUND )
			{
				// Convert special $oid format to MongoDB ObjectId

				return new ObjectId( oid.toString() );
			}

			Object date = ScriptableObject.getProperty( scriptable, "$date" );
			if( date != Scriptable.NOT_FOUND )
			{
				// Convert special $date format to Rhino date

				// (The NativeDate class is private in Rhino, but we can access
				// it like a regular object.)

				Context context = Context.getCurrentContext();
				Scriptable scope = ScriptRuntime.getTopCallScope( context );
				Scriptable nativeDate = context.newObject( scope, "Date", new Object[]
				{
					date
				} );

				return nativeDate;
			}

			Object[] ids = scriptable.getAllIds();
			for( Object id : ids )
			{
				String key = id.toString();
				Object value = ScriptableObject.getProperty( scriptable, key );
				Object converted = convertSpecial( value );
				if( converted != value )
					ScriptableObject.putProperty( scriptable, key, converted );
			}
		}

		return object;
	}

	// //////////////////////////////////////////////////////////////////////////
	// Private

	private static void encode( StringBuilder s, Object object, boolean indent, int depth )
	{
		if( indent )
			indent( s, depth );

		if( object == null )
		{
			s.append( "null" );
		}
		else if( object instanceof Number )
		{
			s.append( object );
		}
		else if( object instanceof Boolean )
		{
			s.append( object );
		}
		else if( object instanceof Date )
		{
			HashMap<String, Long> map = new HashMap<String, Long>();
			map.put( "$date", ( (Date) object ).getTime() );
			encode( s, map, depth );
		}
		else if( object instanceof ObjectId )
		{
			HashMap<String, String> map = new HashMap<String, String>();
			map.put( "$oid", ( (ObjectId) object ).toStringMongod() );
			encode( s, map, depth );
		}
		else if( object instanceof NativeJavaObject )
		{
			// This happens either because the developer purposely creates a
			// Java object, or because it was returned from a Java call and
			// wrapped by Rhino.

			encode( s, ( (NativeJavaObject) object ).unwrap(), false, depth );
		}
		else if( object instanceof Collection )
		{
			encode( s, (Collection<?>) object, depth );
		}
		else if( object instanceof Map )
		{
			encode( s, (Map<?, ?>) object, depth );
		}
		else if( object instanceof NativeArray )
		{
			encode( s, (NativeArray) object, depth );
		}
		else if( object instanceof ScriptableObject )
		{
			ScriptableObject scriptable = (ScriptableObject) object;
			String className = scriptable.getClassName();
			if( className.equals( "Date" ) )
			{
				// (The NativeDate class is private in Rhino, but we can access
				// it like a regular object.)

				Object time = ScriptableObject.callMethod( scriptable, "getTime", null );
				if( time instanceof Number )
				{
					encode( s, new Date( ( (Number) time ).longValue() ), false, depth );
					return;
				}
			}
			else if( className.equals( "String" ) )
			{
				// Unpack NativeString

				s.append( '\"' );
				s.append( escape( object.toString() ) );
				s.append( '\"' );
			}
			else
			{
				encode( s, scriptable, depth );
			}
		}
		else
		{
			s.append( '\"' );
			s.append( escape( object.toString() ) );
			s.append( '\"' );
		}
	}

	private static void encode( StringBuilder s, Collection<?> collection, int depth )
	{
		s.append( '[' );

		Iterator<?> i = collection.iterator();
		if( i.hasNext() )
		{
			if( depth > -1 )
				s.append( '\n' );

			while( true )
			{
				Object value = i.next();

				encode( s, value, true, depth > -1 ? depth + 1 : -1 );

				if( i.hasNext() )
				{
					s.append( ',' );
					if( depth > -1 )
						s.append( '\n' );
				}
				else
					break;
			}

			if( depth > -1 )
				s.append( '\n' );
		}

		if( depth > -1 )
			indent( s, depth );
		s.append( ']' );
	}

	private static void encode( StringBuilder s, Map<?, ?> map, int depth )
	{
		s.append( '{' );

		Iterator<?> i = map.entrySet().iterator();
		if( i.hasNext() )
		{
			if( depth > -1 )
				s.append( '\n' );

			while( true )
			{
				Map.Entry<?, ?> entry = (Map.Entry<?, ?>) i.next();
				String key = entry.getKey().toString();
				Object value = entry.getValue();

				if( depth > -1 )
					indent( s, depth + 1 );

				s.append( '\"' );
				s.append( escape( key ) );
				s.append( "\":" );

				if( depth > -1 )
					s.append( ' ' );

				encode( s, value, false, depth > -1 ? depth + 1 : -1 );

				if( i.hasNext() )
				{
					s.append( ',' );
					if( depth > -1 )
						s.append( '\n' );
				}
				else
					break;
			}

			if( depth > -1 )
				s.append( '\n' );
		}

		if( depth > -1 )
			indent( s, depth );
		s.append( '}' );
	}

	private static void encode( StringBuilder s, NativeArray array, int depth )
	{
		s.append( '[' );

		long length = array.getLength();
		if( length > 0 )
		{
			if( depth > -1 )
				s.append( '\n' );

			for( int i = 0; i < length; i++ )
			{
				Object value = ScriptableObject.getProperty( array, i );

				encode( s, value, true, depth > -1 ? depth + 1 : -1 );

				if( i < length - 1 )
				{
					s.append( ',' );
					if( depth > -1 )
						s.append( '\n' );
				}
			}

			if( depth > -1 )
				s.append( '\n' );
		}

		if( depth > -1 )
			indent( s, depth );
		s.append( ']' );
	}

	private static void encode( StringBuilder s, ScriptableObject object, int depth )
	{
		s.append( '{' );

		Object[] ids = object.getAllIds();
		if( ids.length > 0 )
		{
			if( depth > -1 )
				s.append( '\n' );

			int length = ids.length;
			for( int i = 0; i < length; i++ )
			{
				String key = ids[i].toString();
				Object value = ScriptableObject.getProperty( object, key );

				if( depth > -1 )
					indent( s, depth + 1 );

				s.append( '\"' );
				s.append( escape( key ) );
				s.append( "\":" );

				if( depth > -1 )
					s.append( ' ' );

				encode( s, value, false, depth > -1 ? depth + 1 : -1 );

				if( i < length - 1 )
				{
					s.append( ',' );
					if( depth > -1 )
						s.append( '\n' );
				}
			}

			if( depth > -1 )
				s.append( '\n' );
		}

		if( depth > -1 )
			indent( s, depth );
		s.append( '}' );
	}

	private static void indent( StringBuilder s, int depth )
	{
		for( int i = 0; i < depth; i++ )
			s.append( "  " );
	}

	private static String escape( String string )
	{
		string = string.replaceAll( "\\\\", "\\\\\\" );
		string = string.replaceAll( "\\n", "\\\\n" );
		string = string.replaceAll( "\\r", "\\\\r" );
		string = string.replaceAll( "\\\"", "\\\\\"" );
		return string;
	}
}
