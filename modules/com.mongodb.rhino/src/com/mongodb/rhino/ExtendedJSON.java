/**
 * Copyright 2010 Three Crickets LLC.
 * <p>
 * The contents of this file are subject to the terms of the Apache License
 * version 2.0: http://www.opensource.org/licenses/apache2.0.php
 * <p>
 * Alternatively, you can obtain a royalty free commercial license with less
 * limitations, transferable or non-transferable, directly from Three Crickets
 * at http://threecrickets.com/
 */

package com.mongodb.rhino;

import java.util.Date;

import org.bson.types.Binary;
import org.bson.types.ObjectId;
import org.mozilla.javascript.Context;
import org.mozilla.javascript.ScriptRuntime;
import org.mozilla.javascript.Scriptable;
import org.mozilla.javascript.ScriptableObject;

import com.mongodb.DBRefBase;
import com.mongodb.rhino.util.Base64;

/**
 * Support for <a
 * href="http://www.mongodb.org/display/DOCS/Mongo+Extended+JSON">MongoDB's
 * extended JSON format</a>.
 * 
 * @author Tal Liron
 */
public class ExtendedJSON
{
	//
	// Static operations
	//

	/**
	 * Converts JavaScript objects adhering to MongoDB's extended JSON to BSON
	 * types: {$oid:'objectid'}, {$binary:'base64',$type:'hex'},
	 * {$ref:'collection',$id:'objectid'}.
	 * <p>
	 * The {$date:timestamp} extended JSON format can be converted to either a
	 * JavaScript date object or a JVM date object.
	 * 
	 * @param scriptable
	 *        The JavaScript object
	 * @param javaScriptDates
	 *        Whether to convert the $date format to a JavaScript date or a JVM
	 *        Date
	 * @return A BSON object, a JVM date, a JavaScript date or null
	 */
	public static Object fromExtendedJSON( ScriptableObject scriptable, boolean javaScriptDates )
	{
		Object date = ScriptableObject.getProperty( scriptable, "$date" );
		if( date != Scriptable.NOT_FOUND )
		{
			if( javaScriptDates )
			{
				// Convert extended JSON $date format to Rhino date

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
			else
			{
				// Convert extended JSON $date format to JVM Date

				long dateTimestamp;
				if( date instanceof Number )
					dateTimestamp = ( (Number) date ).longValue();
				else
					// Fallback to string conversion, just in case
					dateTimestamp = Long.parseLong( date.toString() );
				return new Date( dateTimestamp );
			}
		}

		Object oid = ScriptableObject.getProperty( scriptable, "$oid" );
		if( oid != Scriptable.NOT_FOUND )
		{
			// Convert extended JSON $oid format to MongoDB ObjectId

			return new ObjectId( oid.toString() );
		}

		Object binary = ScriptableObject.getProperty( scriptable, "$binary" );
		if( binary != Scriptable.NOT_FOUND )
		{
			// Convert extended JSON $binary format to MongoDB Binary

			Object type = ScriptableObject.getProperty( scriptable, "$type" );
			byte typeNumber = Byte.valueOf( type.toString(), 16 );
			byte[] data = Base64.decodeFast( binary.toString() );
			return new Binary( typeNumber, data );
		}

		Object ref = ScriptableObject.getProperty( scriptable, "$ref" );
		if( ref != Scriptable.NOT_FOUND )
		{
			// Convert extended JSON $ref format to MongoDB DBRef

			Object id = ScriptableObject.getProperty( scriptable, "$id" );
			String idString = null;
			if( id instanceof ScriptableObject )
			{
				Object idOid = ScriptableObject.getProperty( (ScriptableObject) id, "$oid" );
				if( idOid != null )
					idString = idOid.toString();
			}
			if( idString == null )
				idString = id.toString();
			if( oid != Scriptable.NOT_FOUND )
				return new DBRefBase( null, ref.toString(), idString );
		}

		return null;
	}
}
